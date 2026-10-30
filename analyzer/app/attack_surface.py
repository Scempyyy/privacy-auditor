"""Android Attack Surface Explorer: Analyzes exported application components.

Inspects Activities, Services, Broadcast Receivers, and Content Providers for
external exposure and missing permission guards.
"""
from typing import Any
from androguard.core.apk import APK

from app.models import (
    AndroidComponentFinding,
    AttackSurfaceReport,
)

ATTACK_SURFACE_LIMITATIONS = [
    "Static manifest component analysis identifies declared entry points; runtime intent firewall or component-level authorization checks inside code are not fully evaluated.",
    "Exported components are not inherently vulnerabilities. For example, primary launcher activities or standard deep-link handlers are intentionally public.",
    "Components protected by platform permissions depend on the calling application possessing the required permission grant."
]


def analyze_attack_surface(apk: APK) -> AttackSurfaceReport:
    """Inspects manifest application components and classifies external exposure risks."""
    manifest = apk.get_android_manifest_xml()
    if manifest is None:
        return AttackSurfaceReport(
            total_components=0,
            exported_count=0,
            protected_count=0,
            unprotected_count=0,
            activities_count=0,
            services_count=0,
            receivers_count=0,
            providers_count=0,
            components=[],
            summary="Manifest XML could not be parsed.",
            limitations=ATTACK_SURFACE_LIMITATIONS,
        )

    app_elem = manifest.find("application")
    android_ns = "{http://schemas.android.com/apk/res/android}"

    activities = app_elem.findall("activity") if app_elem is not None else []
    services = app_elem.findall("service") if app_elem is not None else []
    receivers = app_elem.findall("receiver") if app_elem is not None else []
    providers = app_elem.findall("provider") if app_elem is not None else []

    findings: list[AndroidComponentFinding] = []

    component_groups = [
        ("activity", activities),
        ("service", services),
        ("receiver", receivers),
        ("provider", providers),
    ]

    for comp_type, elems in component_groups:
        for e in elems:
            name = e.get(android_ns + "name") or "unnamed_component"
            exported_attr = e.get(android_ns + "exported")
            intent_filters = e.findall("intent-filter")
            has_filter = len(intent_filters) > 0
            perm = e.get(android_ns + "permission")
            grant_uri = e.get(android_ns + "grantUriPermissions", "false").lower() == "true"

            # Check if launcher or main activity
            is_launcher = False
            for filt in intent_filters:
                actions = [a.get(android_ns + "name") for a in filt.findall("action")]
                categories = [c.get(android_ns + "name") for c in filt.findall("category")]
                if "android.intent.action.MAIN" in actions and "android.intent.category.LAUNCHER" in categories:
                    is_launcher = True

            # Effective exported state
            if exported_attr is not None:
                is_exported = (exported_attr.lower() == "true")
            else:
                is_exported = has_filter

            # Risk classification and explanation
            if not is_exported:
                access = "internal_non_exported"
                risk = "low"
                explanation = "Internal component not accessible to external third-party applications."
                remediation = None
            elif perm:
                access = "protected_by_permission"
                risk = "info"
                explanation = f"Exported but protected by required permission guard: '{perm}'."
                remediation = "Verify that the required permission has an appropriate protectionLevel (e.g. signature or dangerous)."
            elif is_launcher:
                access = "externally_accessible"
                risk = "info"
                explanation = "Main application entry point / launcher activity (intentionally accessible to system and user)."
                remediation = None
            elif comp_type == "provider":
                access = "externally_accessible"
                risk = "high"
                explanation = "Content Provider is exported to all external applications without permission guards, risking unauthorized data queries or alterations."
                remediation = "Set android:exported='false' or guard with android:readPermission and android:writePermission."
            elif comp_type == "service":
                access = "externally_accessible"
                risk = "medium"
                explanation = "Background Service is exported without permission guards, potentially allowing external apps to invoke background operations or bind."
                remediation = "Set android:exported='false' unless designed to serve external apps via IPC."
            elif comp_type == "receiver":
                access = "externally_accessible"
                risk = "medium"
                explanation = "Broadcast Receiver is exported without permission guards and can receive broadcasts dispatched by any application."
                remediation = "Set android:exported='false' or restrict dispatcher via android:permission."
            else:
                access = "externally_accessible"
                risk = "medium"
                explanation = "Activity is exported without permission restriction; other applications can launch this screen directly."
                remediation = "Review whether direct external intent navigation is intended; otherwise declare android:exported='false'."

            findings.append(
                AndroidComponentFinding(
                    component_type=comp_type,
                    name=name,
                    is_exported=is_exported,
                    permission=perm,
                    has_intent_filter=has_filter,
                    grant_uri_permissions=grant_uri,
                    access_classification=access,
                    risk_level=risk,
                    explanation=explanation,
                    remediation_hint=remediation,
                )
            )

    exported_count = sum(1 for f in findings if f.is_exported)
    protected_count = sum(1 for f in findings if f.access_classification == "protected_by_permission")
    unprotected_count = sum(1 for f in findings if f.is_exported and f.access_classification != "protected_by_permission" and f.risk_level in ("high", "medium"))

    summary = (
        f"Manifest declares {len(findings)} total components across {len(activities)} activities, "
        f"{len(services)} services, {len(receivers)} broadcast receivers, and {len(providers)} content providers. "
        f"{exported_count} components are externally accessible, of which {unprotected_count} are exported without permission guards."
    )

    return AttackSurfaceReport(
        total_components=len(findings),
        exported_count=exported_count,
        protected_count=protected_count,
        unprotected_count=unprotected_count,
        activities_count=len(activities),
        services_count=len(services),
        receivers_count=len(receivers),
        providers_count=len(providers),
        components=findings,
        summary=summary,
        limitations=ATTACK_SURFACE_LIMITATIONS,
    )
