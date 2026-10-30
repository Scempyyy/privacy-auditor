"""Safe APK validation and static analysis orchestration."""
import logging
import tempfile
import uuid
import zipfile
from pathlib import Path
from typing import Any

from androguard.core.apk import APK
from androguard.core.dex import DEX

from app.knowledge import load_knowledge
from app.models import AnalysisReport
from app.scoring import calculate_score

logger = logging.getLogger(__name__)
MAX_UPLOAD_BYTES = 100 * 1024 * 1024
MAX_ZIP_ENTRIES = 20_000
MAX_UNCOMPRESSED_BYTES = 500 * 1024 * 1024
MAX_COMPRESSION_RATIO = 200


class InvalidApk(ValueError):
    """The upload is not a safe, structurally valid APK."""


def validate_archive(path: Path) -> None:
    if path.stat().st_size < 4:
        raise InvalidApk("Uploaded file is not a valid APK archive")
    try:
        with zipfile.ZipFile(path) as archive:
            entries = archive.infolist()
            if len(entries) > MAX_ZIP_ENTRIES:
                raise InvalidApk("APK archive contains too many entries")
            names: set[str] = set()
            total = 0
            for entry in entries:
                name = entry.filename
                normalized = name.replace("\\", "/")
                if normalized.startswith("/") or any(part == ".." for part in normalized.split("/")):
                    raise InvalidApk("APK archive contains an unsafe path")
                if name in names:
                    raise InvalidApk("APK archive contains duplicate entries")
                names.add(name)
                if (entry.external_attr >> 16) & 0o170000 == 0o120000:
                    raise InvalidApk("APK archive contains a symbolic link")
                total += entry.file_size
                if total > MAX_UNCOMPRESSED_BYTES:
                    raise InvalidApk("APK archive expands beyond the allowed size")
                if entry.file_size > 0 and entry.compress_size == 0:
                    raise InvalidApk("APK archive contains an invalid compressed entry")
                if entry.compress_size and entry.file_size / entry.compress_size > MAX_COMPRESSION_RATIO:
                    raise InvalidApk("APK archive contains an unsafe compression ratio")
            if "AndroidManifest.xml" not in names:
                raise InvalidApk("APK archive is missing AndroidManifest.xml")
            bad = archive.testzip()
            if bad:
                raise InvalidApk("APK archive contains a corrupted entry")
    except (zipfile.BadZipFile, OSError, RuntimeError) as exc:
        raise InvalidApk("Uploaded file is not a valid APK archive") from exc


def _optional_int(value: Any) -> int | None:
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def match_tracker_signatures(classes: list[str], signatures: dict[str, dict[str, str]]) -> list[tuple[str, str]]:
    """Return one matching class per curated class-prefix signature."""
    matches: list[tuple[str, str]] = []
    for tracker_id, tracker in sorted(signatures.items()):
        if tracker["signature_type"] != "class_prefix":
            continue
        evidence = next((name for name in classes if name.startswith(tracker["signature"])), None)
        if evidence:
            matches.append((tracker_id, evidence))
    return matches


def unique_permissions(declarations: list[str]) -> list[str]:
    """Preserve manifest order while removing duplicate declarations."""
    return list(dict.fromkeys(declarations))


def _apk_metadata(path: Path) -> tuple[APK, list[str]]:
    try:
        apk = APK(str(path))
        if not apk.is_valid_APK():
            raise InvalidApk("APK manifest could not be parsed")
        dex_names: set[str] = set()
        for dex_bytes in apk.get_all_dex():
            try:
                dex = DEX(dex_bytes)
                dex_names.update(dex.get_classes_names())
            except Exception:
                logger.info("Skipping unreadable DEX entry during static inspection")
        permissions = unique_permissions(apk.get_permissions())
        return apk, sorted(dex_names) + permissions
    except InvalidApk:
        raise
    except Exception as exc:
        logger.info("APK parsing failed: %s", type(exc).__name__)
        raise InvalidApk("APK manifest or bytecode could not be parsed") from exc


def analyze_path(path: Path, category: str) -> AnalysisReport:
    validate_archive(path)
    knowledge = load_knowledge()
    apk, evidence = _apk_metadata(path)
    manifest = apk.get_android_manifest_xml()
    application = manifest.find("application") if manifest is not None else None
    android_ns = "{http://schemas.android.com/apk/res/android}"
    debuggable = application is not None and application.get(android_ns + "debuggable", "false").lower() == "true"
    cleartext = application is not None and application.get(android_ns + "usesCleartextTraffic", "false").lower() == "true"
    category_rules = knowledge["categories"].get(category, {}).get("permissions", {})
    declared_protection_levels = {
        node.get(android_ns + "name"): node.get(android_ns + "protectionLevel")
        for node in manifest.findall("permission") if node.get(android_ns + "name")
    } if manifest is not None else {}
    findings: list[dict[str, Any]] = []
    for permission in sorted(unique_permissions(apk.get_permissions())):
        info = knowledge["permissions"].get(permission)
        if info:
            classification = category_rules.get(permission, "Unusual")
            risk = info["risk"]
            group = info["group"]
            explanation = f"{info['explanation']} Category classification: {classification}."
            source = info["source"]
        else:
            classification, risk, group = "Unknown", "Unknown", None
            explanation = "Permission is absent from the curated knowledge base; no risk classification was inferred."
            source = None
        findings.append({"name": permission, "protection_level": declared_protection_levels.get(permission),
                         "risk": risk, "category_classification": classification,
                         "group": group, "explanation": explanation, "source": source})
    tracker_findings: list[dict[str, Any]] = []
    classes = [item for item in evidence if item.startswith("L") and item.endswith(";")]
    for tracker_id, matched in match_tracker_signatures(classes, knowledge["trackers"]).copy():
        tracker = knowledge["trackers"][tracker_id]
        if matched:
            tracker_findings.append({"tracker_id": tracker_id, "name": tracker["name"],
                "category": tracker["category"], "signature_type": tracker["signature_type"],
                "evidence": matched, "confidence": "high", "source": tracker["source"],
                "attribution": tracker["attribution"],
                "limitation": "A class signature match indicates embedded code evidence, not active tracking."})
    security: list[dict[str, str]] = []
    if cleartext:
        security.append({"id": "cleartext_traffic", "title": "Cleartext traffic allowed", "detail": "The manifest permits unencrypted network traffic."})
    target_sdk = _optional_int(apk.get_target_sdk_version())
    if target_sdk is not None and target_sdk < 30:
        security.append({"id": "outdated_target_sdk", "title": "Older target SDK", "detail": f"The application targets Android API {target_sdk}."})
    if debuggable:
        security.append({"id": "debuggable", "title": "Debuggable build", "detail": "The manifest marks this build as debuggable."})
    score, grade, deductions = calculate_score(findings, tracker_findings, target_sdk, cleartext, debuggable)
    revocations = []
    for item in findings:
        guidance = knowledge["revoke_steps"].get(item["name"])
        if guidance and item["risk"] in {"Critical", "High", "Moderate"}:
            revocations.append({"permission": item["name"], "steps": guidance["steps"]})
    try:
        app_name = apk.get_app_name()
    except Exception:
        app_name = None
    manifest_root = manifest
    compile_sdk = _optional_int(manifest_root.get("{http://schemas.android.com/apk/res/android}compileSdkVersion")) if manifest_root is not None else None
    return AnalysisReport(scan_id=uuid.uuid4().hex,
        package_name=apk.get_package(), app_name=app_name, version_name=apk.get_androidversion_name(),
        version_code=_optional_int(apk.get_androidversion_code()), min_sdk=_optional_int(apk.get_min_sdk_version()),
        target_sdk=target_sdk, compile_sdk=compile_sdk, category=category,
        permissions=findings, trackers=tracker_findings, security_findings=security, score=score, grade=grade,
        deductions=deductions, revoke_steps=revocations,
        limitations=["Declared permissions do not prove runtime use.", "Static signatures do not prove active tracking.",
                     "Analysis does not execute the application and may miss obfuscated or dynamically loaded code.",
                     "Referenced network security configuration resources are not resolved."])


async def analyze_upload(upload: Any, category: str) -> AnalysisReport:
    size = 0
    try:
        with tempfile.TemporaryDirectory(prefix="android-privacy-auditor-") as temp_dir:
            path = Path(temp_dir) / "upload.apk"
            with path.open("wb") as target:
                while chunk := await upload.read(1024 * 1024):
                    size += len(chunk)
                    if size > MAX_UPLOAD_BYTES:
                        raise InvalidApk("APK exceeds the 100 MB upload limit")
                    target.write(chunk)
            if size == 0:
                raise InvalidApk("Uploaded APK is empty")
            return analyze_path(path, category)
    finally:
        await upload.close()
