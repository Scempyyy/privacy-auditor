"""Privacy Nutrition Label Generator: Synthesizes high-level user-facing privacy posture.

Transforms raw permissions, X-Ray bytecode evidence, and tracker signatures into
an easily readable consumer privacy card with clear evidence boundaries.
"""
from typing import Any
from app.models import (
    PrivacyNutritionLabel,
    PrivacyNutritionSection,
)

NUTRITION_LIMITATIONS_NOTICE = (
    "This Privacy Nutrition Label synthesizes static analysis findings (manifest declarations, compiled bytecode callsites, and SDK signatures). "
    "Static evidence indicates potential capability and code structure, not proof of runtime data transmission or active user surveillance."
)


def build_nutrition_label(
    package_name: str,
    app_name: str | None,
    score: int,
    grade: str,
    permissions: list[dict[str, Any]],
    trackers: list[dict[str, Any]],
    xray_findings: list[dict[str, Any]],
    attack_surface_dict: dict[str, Any] | None = None,
) -> PrivacyNutritionLabel:
    """Constructs a structured Privacy Nutrition Label."""
    perm_names = {p["name"] for p in permissions}
    xray_map = {f["permission"]: f for f in xray_findings}

    sections: list[PrivacyNutritionSection] = []

    # 1. Precise Location Access
    loc_perms = {"android.permission.ACCESS_FINE_LOCATION", "android.permission.ACCESS_COARSE_LOCATION", "android.permission.ACCESS_BACKGROUND_LOCATION"}
    has_loc = any(p in perm_names for p in loc_perms)
    loc_xray = any(xray_map.get(p, {}).get("status") == "api_reference_found" for p in loc_perms)
    if loc_xray:
        sections.append(PrivacyNutritionSection(
            category_id="location",
            title="Geographic Location",
            status="active_evidence",
            evidence_type="dex_api_callsite",
            badge_label="Code Reference Found",
            details="Compiled DEX bytecode calls Android LocationManager or Google FusedLocation provider.",
            consequences_summary="Can determine your physical coordinates, home/work routine, and travel trajectory.",
            suggested_action="Revoke location in Android Settings → Apps → Permissions, or select 'Approximate' location only.",
        ))
    elif has_loc:
        sections.append(PrivacyNutritionSection(
            category_id="location",
            title="Geographic Location",
            status="declared_capability",
            evidence_type="manifest_permission",
            badge_label="Permission Declared",
            details="Declared in AndroidManifest.xml, though direct SDK entry points were not matched in X-Ray.",
            consequences_summary="App requests capability to access device location.",
            suggested_action="Review whether this app requires location access for its stated purpose.",
        ))
    else:
        sections.append(PrivacyNutritionSection(
            category_id="location",
            title="Geographic Location",
            status="not_detected",
            evidence_type="none",
            badge_label="Not Requested",
            details="No location permissions declared in manifest.",
            consequences_summary="Cannot access GPS coordinates or network-derived location.",
        ))

    # 2. Hardware Identifiers & Phone Identity
    phone_perms = {"android.permission.READ_PHONE_STATE", "android.permission.READ_PHONE_NUMBERS"}
    has_phone = any(p in perm_names for p in phone_perms)
    phone_xray = any(xray_map.get(p, {}).get("status") == "api_reference_found" for p in phone_perms)
    if phone_xray:
        sections.append(PrivacyNutritionSection(
            category_id="device_identity",
            title="Device & Telephony Identity",
            status="active_evidence",
            evidence_type="dex_api_callsite",
            badge_label="Code Reference Found",
            details="Bytecode calls TelephonyManager methods (e.g. carrier name or device status).",
            consequences_summary="Can read cellular carrier, telephony status, and ongoing call states.",
            suggested_action="Deny Phone state permissions if telephony features are non-essential.",
        ))
    elif has_phone:
        sections.append(PrivacyNutritionSection(
            category_id="device_identity",
            title="Device & Telephony Identity",
            status="declared_capability",
            evidence_type="manifest_permission",
            badge_label="Permission Declared",
            details="READ_PHONE_STATE declared in manifest.",
            consequences_summary="Requests access to cellular carrier and telephony state.",
            suggested_action="Check why the application declares telephony state access.",
        ))
    else:
        sections.append(PrivacyNutritionSection(
            category_id="device_identity",
            title="Device & Telephony Identity",
            status="not_detected",
            evidence_type="none",
            badge_label="Not Requested",
            details="No telephony identity permissions requested.",
            consequences_summary="Cannot access cellular device status or telephone numbers.",
        ))

    # 3. Third-Party Tracker & Analytics SDKs
    ad_trackers = [t for t in trackers if t.get("category") == "advertising"]
    analytics_trackers = [t for t in trackers if t.get("category") in ("analytics", "profiling")]
    if trackers:
        names = ", ".join(t.get("name", "") for t in trackers[:3])
        if len(trackers) > 3:
            names += f" (+{len(trackers) - 3} more)"
        sections.append(PrivacyNutritionSection(
            category_id="trackers",
            title="Advertising & Analytics SDKs",
            status="active_evidence",
            evidence_type="tracker_signature",
            badge_label=f"{len(trackers)} SDKs Embedded",
            details=f"DEX classes match known tracking frameworks: {names}.",
            consequences_summary="Embedded third-party libraries may gather device usage analytics or serve personalized ads.",
            suggested_action="Use a DNS-level tracker blocker (e.g. NextDNS / AdGuard) or reset Advertising ID in Google Settings.",
        ))
    else:
        sections.append(PrivacyNutritionSection(
            category_id="trackers",
            title="Advertising & Analytics SDKs",
            status="not_detected",
            evidence_type="none",
            badge_label="No Known SDKs",
            details="No Exodus tracker signatures matched in decompiled DEX classes.",
            consequences_summary="No known third-party commercial analytics or advertising libraries identified.",
        ))

    # 4. Storage & Personal Files
    storage_perms = {"android.permission.READ_EXTERNAL_STORAGE", "android.permission.WRITE_EXTERNAL_STORAGE", "android.permission.MANAGE_EXTERNAL_STORAGE"}
    has_storage = any(p in perm_names for p in storage_perms)
    if "android.permission.MANAGE_EXTERNAL_STORAGE" in perm_names:
        sections.append(PrivacyNutritionSection(
            category_id="storage",
            title="Files & Media Storage",
            status="active_evidence",
            evidence_type="manifest_permission",
            badge_label="All Files Access (Critical)",
            details="Requests broad unscoped filesystem access bypassing Android Scoped Storage.",
            consequences_summary="Can read and write all user documents, photos, and files across device storage.",
            suggested_action="Revoke All Files Access in Android Special App Access settings.",
        ))
    elif has_storage:
        sections.append(PrivacyNutritionSection(
            category_id="storage",
            title="Files & Media Storage",
            status="declared_capability",
            evidence_type="manifest_permission",
            badge_label="Shared Storage Declared",
            details="Declares shared external storage read/write permissions.",
            consequences_summary="May access shared photos, music, and downloads.",
            suggested_action="Ensure Scoped Storage photo picker is utilized where possible.",
        ))
    else:
        sections.append(PrivacyNutritionSection(
            category_id="storage",
            title="Files & Media Storage",
            status="not_detected",
            evidence_type="none",
            badge_label="Not Requested",
            details="No broad external storage permissions requested.",
            consequences_summary="Restricted to app-specific private storage directory.",
        ))

    # 5. External Component Attack Surface
    if attack_surface_dict:
        unprot = attack_surface_dict.get("unprotected_count", 0)
        exp = attack_surface_dict.get("exported_count", 0)
        if unprot > 0:
            sections.append(PrivacyNutritionSection(
                category_id="attack_surface",
                title="External Component Exposure",
                status="active_evidence",
                evidence_type="component_exposure",
                badge_label=f"{unprot} Unprotected Components",
                details=f"{exp} components exported, with {unprot} lacking permission guards.",
                consequences_summary="Other third-party apps on the phone can invoke these activities or services directly.",
                suggested_action="Developers should restrict exported components with android:permission or set exported='false'.",
            ))
        else:
            sections.append(PrivacyNutritionSection(
                category_id="attack_surface",
                title="External Component Exposure",
                status="not_detected",
                evidence_type="none",
                badge_label="Well Guarded",
                details="Exported components are appropriately protected with permission guards or restricted internally.",
                consequences_summary="External applications cannot freely invoke sensitive internal components.",
            ))

    key_takeaways = []
    if score >= 80:
        key_takeaways.append("Application demonstrates a disciplined, proportionate permission and privacy footprint.")
    elif score >= 60:
        key_takeaways.append("Application contains moderate privacy exposure factors (e.g. analytics SDKs or sensitive access).")
    else:
        key_takeaways.append("Elevated privacy exposure: multiple high-risk permissions or advertising frameworks detected.")

    if trackers:
        key_takeaways.append(f"{len(trackers)} third-party SDK signature(s) detected in compiled bytecode.")
    if has_loc:
        key_takeaways.append("Location capability declared; verify whether continuous navigation is required.")

    return PrivacyNutritionLabel(
        package_name=package_name,
        app_name=app_name,
        score=score,
        grade=grade,
        sections=sections,
        key_takeaways=key_takeaways,
        limitations_notice=NUTRITION_LIMITATIONS_NOTICE,
    )
