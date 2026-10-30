"""Privacy X-Ray: Permission-to-bytecode evidence analysis engine.

Inspects DEX bytecode to discover static method references and opcode callsites
matching curated Android privacy-sensitive APIs.
"""
from typing import Any
from loguru import logger
from androguard.core.apk import APK
from androguard.core.dex import DEX

from app.models import (
    XRayEvidenceRecord,
    PermissionXRayFinding,
    PrivacyXRayReport,
)

# Suppress androguard internal debug log churn during bytecode inspection
logger.remove()

MAPPING_VERSION = "2026.10.30"
XRAY_LIMITATIONS = [
    "A DEX API reference or callsite indicates compiled static bytecode evidence, not proof of runtime execution or active data transmission.",
    "Absence of an observed API reference ('no_reference_observed') does not prove a permission is unused at runtime; the app may invoke functionality via reflection, native JNI libraries, dynamic code loading, or unmapped framework helpers.",
    "Static inspection does not assess whether runtime permission grants are dynamically requested or enforced by the user's Android OS version.",
    "Dynamic and reflected callsites cannot be fully enumerated using offline static DEX analysis."
]


def extract_dex_evidence(
    apk: APK,
    declared_permissions: set[str],
    api_mappings: list[dict[str, Any]],
) -> PrivacyXRayReport:
    """Inspects all DEX files in the APK for references matching declared permissions."""
    dex_names = list(apk.get_dex_names())
    
    # Filter mappings to permissions declared by this APK
    relevant_mappings = [m for m in api_mappings if m["permission"] in declared_permissions]
    
    # Pre-index mappings by (dex_format_class, method_name)
    def to_dex_type(java_name: str) -> str:
        clean = java_name.replace(".", "/")
        return f"L{clean};"

    class_method_to_mapping: dict[tuple[str, str | None], list[dict[str, Any]]] = {}
    target_classes: set[str] = set()

    for m in relevant_mappings:
        dex_cls = to_dex_type(m["api_class"])
        target_classes.add(dex_cls)
        key = (dex_cls, m.get("method_name"))
        class_method_to_mapping.setdefault(key, []).append(m)
        if m.get("method_name") is None:
            class_method_to_mapping.setdefault((dex_cls, None), []).append(m)

    perm_to_evidence: dict[str, list[XRayEvidenceRecord]] = {p: [] for p in declared_permissions}
    
    # 1. Fast pass: Check which target classes appear in each DEX
    dex_has_target: dict[str, set[str]] = {}
    dex_objects: dict[str, DEX] = {}
    
    for dex_name in dex_names:
        try:
            dex_bytes = apk.get_file(dex_name)
            dex = DEX(dex_bytes)
            dex_objects[dex_name] = dex
            dex_classes = set(dex.get_classes_names())
            matched_targets = target_classes.intersection(dex_classes)
            for m_item in dex.get_methods():
                m_cls = m_item.get_class_name()
                if m_cls in target_classes:
                    matched_targets.add(m_cls)
            dex_has_target[dex_name] = matched_targets
        except Exception:
            continue

    # 2. Opcode callsite inspection for DEX files containing target API references
    for dex_name, dex in dex_objects.items():
        if not dex_has_target.get(dex_name):
            continue
            
        try:
            for c in dex.get_classes():
                caller_class = c.get_name()
                for m in c.get_methods():
                    caller_method = m.get_name()
                    caller_desc = m.get_descriptor()
                    try:
                        instructions = m.get_instructions()
                    except Exception:
                        continue
                        
                    for ins in instructions:
                        op = ins.get_name()
                        if "invoke" in op:
                            out = ins.get_output()
                            for dex_cls in target_classes:
                                if dex_cls in out:
                                    for (m_cls, m_name), mappings in class_method_to_mapping.items():
                                        if m_cls == dex_cls:
                                            if m_name is None or f"->{m_name}(" in out or f"->{m_name};" in out:
                                                for mapping in mappings:
                                                    perm = mapping["permission"]
                                                    rec = XRayEvidenceRecord(
                                                        dex_file=dex_name,
                                                        caller_class=caller_class,
                                                        caller_method=caller_method,
                                                        caller_descriptor=caller_desc,
                                                        referenced_api_class=mapping["api_class"],
                                                        referenced_method=m_name or "<class_reference>",
                                                        method_descriptor=mapping.get("descriptor"),
                                                        instruction_name=op,
                                                        instruction_offset=getattr(ins, "offset", None),
                                                        permission=perm,
                                                        description=mapping["description"],
                                                        source=mapping["source"],
                                                        evidence_level=mapping["evidence_level"],
                                                    )
                                                    existing = perm_to_evidence.setdefault(perm, [])
                                                    if len(existing) < 50:
                                                        if not any(
                                                            e.dex_file == rec.dex_file and
                                                            e.caller_class == rec.caller_class and
                                                            e.caller_method == rec.caller_method and
                                                            e.referenced_method == rec.referenced_method
                                                            for e in existing
                                                        ):
                                                            existing.append(rec)
        except Exception:
            continue

    permission_findings: list[PermissionXRayFinding] = []
    supported_permissions = {m["permission"] for m in api_mappings}

    for perm in sorted(declared_permissions):
        ev_list = perm_to_evidence.get(perm, [])
        if ev_list:
            status = "api_reference_found"
            summary = f"Identified {len(ev_list)} static API bytecode reference(s) matching {perm}."
        elif perm in supported_permissions:
            status = "no_reference_observed"
            summary = f"Curated API signatures for {perm} were checked, but no matching method references were observed in inspected DEX files."
        else:
            status = "not_assessed"
            summary = f"Curated DEX bytecode API mappings are not yet indexed for {perm}."

        permission_findings.append(
            PermissionXRayFinding(
                permission=perm,
                status=status,
                evidence=ev_list,
                summary=summary,
            )
        )

    with_ref = sum(1 for f in permission_findings if f.status == "api_reference_found")
    no_ref = sum(1 for f in permission_findings if f.status == "no_reference_observed")
    not_assessed = sum(1 for f in permission_findings if f.status == "not_assessed")

    return PrivacyXRayReport(
        total_permissions_examined=len(declared_permissions),
        permissions_with_references=with_ref,
        permissions_no_reference_observed=no_ref,
        permissions_not_assessed=not_assessed,
        findings=permission_findings,
        dex_coverage=dex_names,
        mapping_version=MAPPING_VERSION,
        limitations=XRAY_LIMITATIONS,
    )
