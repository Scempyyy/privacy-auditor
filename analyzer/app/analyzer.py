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
from app.models import AnalysisReport, PermissionMetrics, SecurityFinding
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


def match_tracker_signatures(classes: set[str] | list[str], signatures: dict[str, dict[str, Any]]) -> list[tuple[str, str]]:
    """Return one matching class per curated tracker signature."""
    matches: list[tuple[str, str]] = []
    sorted_trackers = sorted(signatures.items(), key=lambda item: item[0])
    
    for tracker_id, tracker in sorted_trackers:
        raw_sig = tracker.get("signature", "").strip()
        if not raw_sig:
            continue
        patterns = [p.strip() for p in raw_sig.split("|") if p.strip()]
        matched_evidence: str | None = None
        for pattern in patterns:
            if pattern.startswith("L") or "/" in pattern:
                for cls_name in classes:
                    if cls_name.startswith(pattern):
                        matched_evidence = cls_name
                        break
            else:
                pattern_prefix = pattern if pattern.endswith(".") else f"{pattern}."
                for cls_name in classes:
                    norm_cls = cls_name[1:-1].replace("/", ".") if (cls_name.startswith("L") and cls_name.endswith(";")) else cls_name
                    if norm_cls.startswith(pattern_prefix) or norm_cls == pattern:
                        matched_evidence = cls_name
                        break
            if matched_evidence:
                break
        if matched_evidence:
            matches.append((tracker_id, matched_evidence))
    return matches


def unique_permissions(declarations: list[str]) -> list[str]:
    """Preserve manifest order while removing duplicate declarations."""
    return list(dict.fromkeys(declarations))


def _apk_metadata(path: Path) -> tuple[APK, set[str], list[str]]:
    try:
        apk = APK(str(path))
        if not apk.is_valid_APK():
            raise InvalidApk("APK manifest could not be parsed")
        
        dotted_classes: set[str] = set()
        for dex_bytes in apk.get_all_dex():
            try:
                dex = DEX(dex_bytes)
                for class_descriptor in dex.get_classes_names():
                    if class_descriptor.startswith("L") and class_descriptor.endswith(";"):
                        dotted = class_descriptor[1:-1].replace("/", ".")
                        dotted_classes.add(dotted)
                    else:
                        dotted_classes.add(class_descriptor)
            except Exception:
                logger.info("Skipping unreadable DEX entry during static inspection")
                
        permissions = unique_permissions(apk.get_permissions())
        return apk, dotted_classes, permissions
    except InvalidApk:
        raise
    except Exception as exc:
        logger.info("APK parsing failed: %s", type(exc).__name__)
        raise InvalidApk("APK manifest or bytecode could not be parsed") from exc


def analyze_path(path: Path, category: str) -> AnalysisReport:
    validate_archive(path)
    knowledge = load_knowledge()
    apk, dotted_classes, permissions = _apk_metadata(path)
    package_name = apk.get_package() or "unknown.package"
    manifest = apk.get_android_manifest_xml()
    application = manifest.find("application") if manifest is not None else None
    android_ns = "{http://schemas.android.com/apk/res/android}"
    
    debuggable = application is not None and application.get(android_ns + "debuggable", "false").lower() == "true"
    cleartext = application is not None and application.get(android_ns + "usesCleartextTraffic", "false").lower() == "true"
    allow_backup = application is not None and application.get(android_ns + "allowBackup", "true").lower() == "true"
    
    category_rules = knowledge["categories"].get(category, {}).get("permissions", {})
    
    declared_protection_levels = {
        node.get(android_ns + "name"): node.get(android_ns + "protectionLevel")
        for node in manifest.findall("permission") if node.get(android_ns + "name")
    } if manifest is not None else {}

    findings: list[dict[str, Any]] = []
    for permission in sorted(permissions):
        info = knowledge["permissions"].get(permission)
        if info:
            risk = info["risk"]
            group = info["group"]
            is_runtime = info.get("is_runtime", False)
            user_impact = info.get("user_impact")
            source = info.get("source")
            
            if permission in category_rules:
                classification = category_rules[permission]
            else:
                classification = "Expected" if risk == "Low" else "Unusual"
                
            explanation = f"{info['explanation']} Category classification: {classification}."
        else:
            classification = "Unclassified"
            risk = "Unclassified"
            group = None
            is_runtime = None
            user_impact = None
            source = None
            if permission.startswith(f"{package_name}."):
                explanation = "Application-defined custom permission declared for component security; unclassified in standard Android framework with no intrinsic risk inferred."
            else:
                explanation = "Permission is absent from the curated knowledge base; classified as Unclassified without inferred risk penalty."
                
        platform_protection_level = declared_protection_levels.get(permission) or (info.get("platform_protection_level") if info else None) or (info.get("protection_level") if info else None)
        grant_mechanism = info.get("grant_mechanism") if info else "unclassified"
        protection_level = platform_protection_level

        findings.append({
            "name": permission,
            "protection_level": protection_level,
            "platform_protection_level": platform_protection_level,
            "grant_mechanism": grant_mechanism,
            "risk": risk,
            "category_classification": classification,
            "group": group,
            "explanation": explanation,
            "source": source,
            "is_runtime": is_runtime,
            "user_impact": user_impact,
        })

    # Calculate exact permission metrics
    metrics = PermissionMetrics(
        total_requested=len(findings),
        classified=sum(1 for f in findings if f["risk"] != "Unclassified"),
        unclassified=sum(1 for f in findings if f["risk"] == "Unclassified"),
        needing_review=sum(1 for f in findings if f["category_classification"] == "Review"),
        unusual=sum(1 for f in findings if f["category_classification"] == "Unusual"),
        high_risk=sum(1 for f in findings if f["risk"] in ("Critical", "High")),
    )

    # Tracker matches
    tracker_findings: list[dict[str, Any]] = []
    matched_trackers = match_tracker_signatures(dotted_classes, knowledge["trackers"])
    
    for tracker_id, evidence in matched_trackers:
        tracker = knowledge["trackers"][tracker_id]
        tracker_findings.append({
            "tracker_id": tracker_id,
            "name": tracker["name"],
            "category": tracker["category"],
            "signature_type": tracker["signature_type"],
            "evidence": evidence,
            "confidence": "high",
            "source": tracker["source"],
            "attribution": tracker["attribution"],
            "limitation": "A class signature match indicates embedded code evidence, not active tracking."
        })

    # Security hygiene
    security: list[SecurityFinding] = []
    
    # 1. Cleartext traffic
    if cleartext:
        security.append(SecurityFinding(
            id="cleartext_traffic",
            title="Cleartext traffic allowed",
            detail="The manifest explicitly permits unencrypted HTTP network communication (android:usesCleartextTraffic=true).",
            status="finding_detected",
            severity="warning"
        ))
    else:
        security.append(SecurityFinding(
            id="encrypted_traffic_enforced",
            title="Encrypted network traffic enforced",
            detail="Cleartext HTTP traffic is disabled, enforcing TLS encrypted network communication.",
            status="checked_clean",
            severity="clean"
        ))

    # 2. Target SDK
    target_sdk = _optional_int(apk.get_target_sdk_version())
    if target_sdk is not None and target_sdk < 23:
        security.append(SecurityFinding(
            id="outdated_target_sdk_pre23",
            title="Legacy Target SDK (Below API 23)",
            detail=f"The application targets Android API {target_sdk}, which lacks the modern runtime permission model.",
            status="finding_detected",
            severity="warning"
        ))
    elif target_sdk is not None and target_sdk <= 29:
        security.append(SecurityFinding(
            id="outdated_target_sdk",
            title="Older Target SDK (API 23–29)",
            detail=f"The application targets Android API {target_sdk}, which predates modern Scoped Storage and fine-grained privacy controls.",
            status="finding_detected",
            severity="warning"
        ))
    elif target_sdk is not None:
        security.append(SecurityFinding(
            id="modern_target_sdk",
            title=f"Modern Target SDK (API {target_sdk})",
            detail=f"The application targets modern Android API {target_sdk}, enforcing current privacy and security platform controls.",
            status="checked_clean",
            severity="clean"
        ))
    else:
        security.append(SecurityFinding(
            id="target_sdk_unspecified",
            title="Target SDK unspecified",
            detail="Target SDK version is not declared in the manifest.",
            status="platform_default",
            severity="info"
        ))

    # 3. Debuggable flag
    if debuggable:
        security.append(SecurityFinding(
            id="debuggable",
            title="Debuggable build enabled",
            detail="The manifest marks this build as debuggable (android:debuggable=true), exposing runtime debugging interfaces.",
            status="finding_detected",
            severity="warning"
        ))
    else:
        security.append(SecurityFinding(
            id="debuggable_disabled",
            title="Debugging disabled",
            detail="Application is not marked as debuggable, preventing unauthorized debugger attachment.",
            status="checked_clean",
            severity="clean"
        ))

    # 4. Backup configuration
    if allow_backup:
        security.append(SecurityFinding(
            id="backup_enabled",
            title="Application backup enabled",
            detail="Application data backup is enabled (android:allowBackup=true). Sensitive app data could be extracted via adb or cloud backups if not excluded by backup rules.",
            status="platform_default",
            severity="info"
        ))
    else:
        security.append(SecurityFinding(
            id="backup_disabled",
            title="Application backup disabled",
            detail="Application data backup is explicitly disabled (android:allowBackup=false).",
            status="checked_clean",
            severity="clean"
        ))

    # Compute deterministic score
    score, grade, deductions = calculate_score(findings, tracker_findings, target_sdk, cleartext, debuggable)

    # Remediation steps
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

    limitations = [
        "Malware scan not performed: This auditor performs static privacy analysis only, not antivirus or anti-malware verification.",
        "Declared permissions indicate capability access requested by the manifest, not proof of active runtime use.",
        "Embedded tracker signatures indicate library presence in DEX bytecode, not proof of active network transmission.",
        "Analysis does not execute the application and cannot observe dynamically loaded bytecode or server-side behavior.",
        "Custom or heavily obfuscated SDK packages may evade static signature detection.",
        "Referenced network security configuration resources are not dynamically resolved.",
    ]

    return AnalysisReport(
        scan_id=uuid.uuid4().hex,
        package_name=package_name,
        app_name=app_name,
        version_name=apk.get_androidversion_name(),
        version_code=_optional_int(apk.get_androidversion_code()),
        min_sdk=_optional_int(apk.get_min_sdk_version()),
        target_sdk=target_sdk,
        compile_sdk=compile_sdk,
        category=category,
        permissions=findings,
        permission_metrics=metrics,
        trackers=tracker_findings,
        security_findings=security,
        score=score,
        grade=grade,
        deductions=deductions,
        revoke_steps=revocations,
        limitations=limitations,
    )


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
