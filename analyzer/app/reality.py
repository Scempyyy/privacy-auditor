"""Privacy Reality Engine: Multi-layer Evidence Correlator.

Correlates findings across 5 distinct evidence layers:
- Layer 1: DECLARED (AndroidManifest.xml permission request)
- Layer 2: STATICALLY_REFERENCED (DEX bytecode callsites discovered)
- Layer 3: DATA_FLOW_EVIDENCE (Static source-to-sink taint traces or potential paths)
- Layer 4: RUNTIME_OBSERVED (Observed during an authorized isolated sandbox session)
- Layer 5: INCONCLUSIVE (Unable to confirm or disprove with available evidence)

Does not conflate layers or claim that absence of evidence proves absence of runtime behavior.
"""
from typing import Any, Literal
from app.models import (
    PermissionFinding,
    PermissionXRayFinding,
    PrivacyRealityItem,
    PrivacyRealityReport,
)


def build_privacy_reality_report(
    permissions: list[PermissionFinding],
    xray_findings: list[PermissionXRayFinding],
    package_name: str,
) -> PrivacyRealityReport:
    """Synthesize multi-layer evidence for every permission and capability."""
    xray_map = {f.permission: f for f in xray_findings}
    items: list[PrivacyRealityItem] = []

    total_declared = len(permissions)
    total_referenced = 0
    total_declared_only = 0
    total_inconclusive = 0

    for perm in permissions:
        perm_name = perm.name if hasattr(perm, "name") else perm["name"]
        is_declared = True
        xray_finding = xray_map.get(perm_name)

        has_static_reference = False
        evidence_records_count = 0
        callsites_sample = []

        if xray_finding and xray_finding.status == "api_reference_found":
            has_static_reference = True
            evidence_records_count = len(xray_finding.evidence)
            for ev in xray_finding.evidence[:3]:
                callsites_sample.append(f"{ev.referenced_api_class}->{ev.referenced_method}()")

        # Classification based on available layers
        if has_static_reference:
            classification = "declared_and_referenced"
            total_referenced += 1
            verdict_explanation = (
                f"Permission declared in AndroidManifest.xml and confirmed with {evidence_records_count} "
                f"Dalvik bytecode API callsite(s). Bytecode contains capability to invoke this subsystem."
            )
        else:
            classification = "declared_only_no_static_call"
            total_declared_only += 1
            verdict_explanation = (
                "Permission declared in AndroidManifest.xml, but static DEX analysis did not observe direct "
                "calls to known framework APIs. Note: Reflection, dynamic loading, or vendor SDKs may still access this."
            )

        items.append(
            PrivacyRealityItem(
                capability_name=perm_name,
                layer1_declared=True,
                layer2_statically_referenced=has_static_reference,
                layer3_data_flow_evidence=False,  # FlowDroid taint analysis status
                layer4_runtime_observed=False,   # Sandbox observation status
                layer5_inconclusive=False,
                classification=classification,
                verdict_explanation=verdict_explanation,
                callsites_count=evidence_records_count,
                callsites_sample=callsites_sample,
            )
        )

    # Sort items: declared and referenced first
    items.sort(key=lambda x: (x.classification != "declared_and_referenced", x.capability_name))

    return PrivacyRealityReport(
        package_name=package_name,
        total_capabilities_assessed=total_declared,
        total_statically_referenced=total_referenced,
        total_declared_only=total_declared_only,
        total_data_flow_traced=0,
        total_runtime_observed=0,
        items=items,
        summary=(
            f"Correlated {total_declared} permissions across evidence layers. "
            f"{total_referenced} capability(ies) have confirmed DEX bytecode callsites; "
            f"{total_declared_only} are declared without direct static framework references observed."
        ),
        limitations=[
            "Layer 2 (Static References) reflects direct Dalvik method references; dynamic class loading (DexClassLoader) or JNI native code is not observed.",
            "Layer 3 (Data Flow) and Layer 4 (Runtime Sandbox) are disabled or unexecuted in standard static scans.",
            "Lack of a static reference does NOT prove an app cannot access data at runtime.",
        ],
    )
