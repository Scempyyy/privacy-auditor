"""Privacy Update Radar: Compares privacy & security posture between two APK versions.

Evaluates both APKs against the same knowledge base snapshot and scoring formulas.
"""
import uuid
from typing import Any
from androguard.core.apk import APK

from app.models import (
    AppMetadataDelta,
    RadarMetadataDiff,
    PermissionChangeItem,
    TrackerChangeItem,
    SecurityChangeItem,
    ScoreChange,
    RadarComparisonReport,
    Deduction,
)
from app.analyzer import (
    _apk_metadata,
    _optional_int,
    match_tracker_signatures,
    unique_permissions,
)
from app.scoring import calculate_score

RADAR_LIMITATIONS = [
    "A higher privacy score indicates an improved heuristic assessment, not proof that the updated application is safe or free of vulnerabilities.",
    "A lower score indicates increased privacy risk factors (e.g. additional permissions or trackers), not proof of malicious intent.",
    "Both APK versions are evaluated against the identical analyzer knowledge-base snapshot to prevent knowledge-base differences from appearing as application changes.",
    "Static comparison inspects declared manifests, security flags, and bytecode signatures; dynamic runtime behavior is not executed or observed."
]


def compare_apks(
    old_path,
    new_path,
    category: str,
    knowledge: dict[str, Any],
    old_sha256: str,
    new_sha256: str,
) -> RadarComparisonReport:
    """Performs deep static comparison of two APK files for the same application package."""
    # 1. Parse both APKs
    old_apk, old_dotted_classes, old_declared_perms = _apk_metadata(old_path)
    new_apk, new_dotted_classes, new_declared_perms = _apk_metadata(new_path)

    old_pkg = old_apk.get_package()
    new_pkg = new_apk.get_package()

    if old_pkg != new_pkg:
        raise ValueError(
            f"Package mismatch: old APK package is '{old_pkg}' but new APK package is '{new_pkg}'. "
            "Privacy Update Radar requires both files to be versions of the same application package."
        )

    if old_sha256 == new_sha256:
        raise ValueError(
            "Identical APKs detected: both uploaded files have the exact same SHA-256 digest. "
            "Please upload two distinct version releases to perform a comparative audit."
        )

    # 2. Extract metadata
    old_meta = {
        "package_name": old_pkg,
        "app_name": old_apk.get_app_name(),
        "version_name": old_apk.get_androidversion_name(),
        "version_code": _optional_int(old_apk.get_androidversion_code()),
        "min_sdk": _optional_int(old_apk.get_min_sdk_version()),
        "target_sdk": _optional_int(old_apk.get_target_sdk_version()),
        "compile_sdk": _optional_int(old_apk.get_effective_target_sdk_version()),
        "apk_sha256": old_sha256,
    }

    new_meta = {
        "package_name": new_pkg,
        "app_name": new_apk.get_app_name(),
        "version_name": new_apk.get_androidversion_name(),
        "version_code": _optional_int(new_apk.get_androidversion_code()),
        "min_sdk": _optional_int(new_apk.get_min_sdk_version()),
        "target_sdk": _optional_int(new_apk.get_target_sdk_version()),
        "compile_sdk": _optional_int(new_apk.get_effective_target_sdk_version()),
        "apk_sha256": new_sha256,
    }

    metadata_diff = RadarMetadataDiff(
        package_name=AppMetadataDelta(
            old_value=old_meta["package_name"],
            new_value=new_meta["package_name"],
            status="unchanged" if old_meta["package_name"] == new_meta["package_name"] else "modified",
        ),
        app_name=AppMetadataDelta(
            old_value=old_meta["app_name"],
            new_value=new_meta["app_name"],
            status="unchanged" if old_meta["app_name"] == new_meta["app_name"] else "modified",
        ),
        version_name=AppMetadataDelta(
            old_value=old_meta["version_name"],
            new_value=new_meta["version_name"],
            status="unchanged" if old_meta["version_name"] == new_meta["version_name"] else "modified",
        ),
        version_code=AppMetadataDelta(
            old_value=old_meta["version_code"],
            new_value=new_meta["version_code"],
            status="unchanged" if old_meta["version_code"] == new_meta["version_code"] else "modified",
        ),
        min_sdk=AppMetadataDelta(
            old_value=old_meta["min_sdk"],
            new_value=new_meta["min_sdk"],
            status="unchanged" if old_meta["min_sdk"] == new_meta["min_sdk"] else "modified",
        ),
        target_sdk=AppMetadataDelta(
            old_value=old_meta["target_sdk"],
            new_value=new_meta["target_sdk"],
            status="unchanged" if old_meta["target_sdk"] == new_meta["target_sdk"] else "modified",
        ),
        compile_sdk=AppMetadataDelta(
            old_value=old_meta["compile_sdk"],
            new_value=new_meta["compile_sdk"],
            status="unchanged" if old_meta["compile_sdk"] == new_meta["compile_sdk"] else "modified",
        ),
        apk_sha256=AppMetadataDelta(
            old_value=old_meta["apk_sha256"],
            new_value=new_meta["apk_sha256"],
            status="modified",
        ),
    )

    # 3. Analyze permissions for both versions
    category_spec = knowledge["categories"].get(category, {})
    category_rules = category_spec.get("permissions", {})

    def evaluate_permissions(declared: list[str]) -> list[dict[str, Any]]:
        deduped = unique_permissions(declared)
        eval_list = []
        for p in deduped:
            info = knowledge["permissions"].get(p)
            if info:
                risk = info["risk"]
                group = info["group"]
                grant_mechanism = info.get("grant_mechanism")
                if p in category_rules:
                    classification = category_rules[p]
                else:
                    classification = "Expected" if risk == "Low" else "Unusual"
            else:
                risk = "Unclassified"
                group = None
                grant_mechanism = "unclassified"
                classification = "Unclassified"
            eval_list.append({
                "name": p,
                "risk": risk,
                "group": group,
                "grant_mechanism": grant_mechanism,
                "category_classification": classification,
            })
        return eval_list

    old_eval_perms = evaluate_permissions(old_declared_perms)
    new_eval_perms = evaluate_permissions(new_declared_perms)

    old_perm_map = {p["name"]: p for p in old_eval_perms}
    new_perm_map = {p["name"]: p for p in new_eval_perms}

    added_perms_names = set(new_perm_map.keys()) - set(old_perm_map.keys())
    removed_perms_names = set(old_perm_map.keys()) - set(new_perm_map.keys())
    retained_perms_count = len(set(old_perm_map.keys()).intersection(set(new_perm_map.keys())))

    added_permissions: list[PermissionChangeItem] = [
        PermissionChangeItem(
            name=p,
            risk=new_perm_map[p]["risk"],
            category_classification=new_perm_map[p]["category_classification"],
            grant_mechanism=new_perm_map[p]["grant_mechanism"],
            change_type="added",
            details="Declared in new APK release; not present in previous release."
        )
        for p in sorted(added_perms_names)
    ]

    removed_permissions: list[PermissionChangeItem] = [
        PermissionChangeItem(
            name=p,
            risk=old_perm_map[p]["risk"],
            category_classification=old_perm_map[p]["category_classification"],
            grant_mechanism=old_perm_map[p]["grant_mechanism"],
            change_type="removed",
            details="Removed in new APK release; previously declared in old release."
        )
        for p in sorted(removed_perms_names)
    ]

    # 4. Analyze Trackers for both versions
    old_matched = match_tracker_signatures(old_dotted_classes, knowledge["trackers"])
    new_matched = match_tracker_signatures(new_dotted_classes, knowledge["trackers"])

    old_tracker_ids = {t[0] for t in old_matched}
    new_tracker_ids = {t[0] for t in new_matched}

    added_tracker_ids = new_tracker_ids - old_tracker_ids
    removed_tracker_ids = old_tracker_ids - new_tracker_ids
    retained_trackers_count = len(old_tracker_ids.intersection(new_tracker_ids))

    new_trackers: list[TrackerChangeItem] = [
        TrackerChangeItem(
            tracker_id=tid,
            name=knowledge["trackers"][tid]["name"],
            category=knowledge["trackers"][tid]["category"],
            change_type="added",
        )
        for tid in sorted(added_tracker_ids)
    ]

    removed_trackers: list[TrackerChangeItem] = [
        TrackerChangeItem(
            tracker_id=tid,
            name=knowledge["trackers"][tid]["name"],
            category=knowledge["trackers"][tid]["category"],
            change_type="removed",
        )
        for tid in sorted(removed_tracker_ids)
    ]

    # 5. Security Hygiene Diff
    android_ns = "{http://schemas.android.com/apk/res/android}"
    old_manifest = old_apk.get_android_manifest_xml()
    new_manifest = new_apk.get_android_manifest_xml()
    old_app_node = old_manifest.find("application") if old_manifest is not None else None
    new_app_node = new_manifest.find("application") if new_manifest is not None else None

    old_cleartext = old_app_node is not None and old_app_node.get(android_ns + "usesCleartextTraffic", "false").lower() == "true"
    new_cleartext = new_app_node is not None and new_app_node.get(android_ns + "usesCleartextTraffic", "false").lower() == "true"
    
    security_changes: list[SecurityChangeItem] = []
    if old_cleartext != new_cleartext:
        security_changes.append(SecurityChangeItem(
            id="cleartext_traffic",
            title="Cleartext Traffic Policy",
            old_status="enabled (insecure)" if old_cleartext else "disabled (secure)",
            new_status="enabled (insecure)" if new_cleartext else "disabled (secure)",
            status="added_risk" if new_cleartext else "resolved_risk",
            detail="The new version changed cleartext HTTP traffic permissions in the manifest."
        ))

    old_target = old_meta["target_sdk"]
    new_target = new_meta["target_sdk"]
    if old_target != new_target:
        status_label = "resolved_risk" if (new_target or 0) > (old_target or 0) else "added_risk"
        security_changes.append(SecurityChangeItem(
            id="target_sdk_update",
            title="Target SDK Version Change",
            old_status=f"API {old_target}" if old_target else "None",
            new_status=f"API {new_target}" if new_target else "None",
            status=status_label,
            detail=f"Target SDK changed from {old_target} to {new_target}."
        ))

    # 6. Scoring comparison using same engine
    old_trackers_for_scoring = [{"tracker_id": tid, "category": knowledge["trackers"][tid]["category"]} for tid in old_tracker_ids]
    new_trackers_for_scoring = [{"tracker_id": tid, "category": knowledge["trackers"][tid]["category"]} for tid in new_tracker_ids]

    old_score, old_grade, old_deductions_raw = calculate_score(
        old_eval_perms, old_trackers_for_scoring, old_meta["target_sdk"], not old_cleartext, False
    )
    new_score, new_grade, new_deductions_raw = calculate_score(
        new_eval_perms, new_trackers_for_scoring, new_meta["target_sdk"], not new_cleartext, False
    )

    old_deductions = [Deduction(**d) for d in old_deductions_raw]
    new_deductions = [Deduction(**d) for d in new_deductions_raw]

    score_diff = new_score - old_score
    if score_diff > 0:
        score_explanation = f"Privacy score improved by +{score_diff} points ({old_score} -> {new_score})."
    elif score_diff < 0:
        score_explanation = f"Privacy score decreased by {score_diff} points ({old_score} -> {new_score})."
    else:
        score_explanation = f"Privacy score remained unchanged at {new_score}/100."

    old_v_label = f"v{old_meta['version_name'] or 'unknown'} ({old_meta['version_code'] or '?'})"
    new_v_label = f"v{new_meta['version_name'] or 'unknown'} ({new_meta['version_code'] or '?'})"

    summary_text = (
        f"Compared {old_v_label} with {new_v_label} for {new_meta['package_name']}. "
        f"The newer release declares {len(added_permissions)} additional permission(s), "
        f"removes {len(removed_permissions)} permission(s), introduces {len(new_trackers)} new tracker signature(s), "
        f"and moves the privacy score from {old_score} to {new_score} ({score_diff:+d} pts)."
    )

    import hashlib
    kb_fingerprint = hashlib.sha256(
        (str(len(knowledge["permissions"])) + str(len(knowledge["trackers"])) + str(len(knowledge["categories"]))).encode()
    ).hexdigest()[:16]

    return RadarComparisonReport(
        comparison_id=str(uuid.uuid4()),
        package_name=new_pkg,
        old_version_label=old_v_label,
        new_version_label=new_v_label,
        category=category,
        metadata_diff=metadata_diff,
        added_permissions=added_permissions,
        removed_permissions=removed_permissions,
        retained_permissions_count=retained_perms_count,
        new_trackers=new_trackers,
        removed_trackers=removed_trackers,
        retained_trackers_count=retained_trackers_count,
        security_changes=security_changes,
        score_change=ScoreChange(
            old_score=old_score,
            new_score=new_score,
            difference=score_diff,
            old_grade=old_grade,
            new_grade=new_grade,
            explanation=score_explanation,
        ),
        old_deductions=old_deductions,
        new_deductions=new_deductions,
        summary_text=summary_text,
        knowledge_base_fingerprint=kb_fingerprint,
        limitations=RADAR_LIMITATIONS,
    )
