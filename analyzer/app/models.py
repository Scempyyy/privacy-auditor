"""Strict API response models."""
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class PermissionFinding(StrictModel):
    name: str
    protection_level: str | None = None
    platform_protection_level: str | None = None
    grant_mechanism: Literal["runtime", "install_time", "special_app_access", "signature_restricted", "unclassified"] | None = None
    risk: Literal["Critical", "High", "Moderate", "Low", "Unclassified", "Unknown"]
    category_classification: Literal["Expected", "Review", "Unusual", "Unclassified", "Unknown"]
    group: str | None = None
    explanation: str
    source: str | None = None
    is_runtime: bool | None = None
    user_impact: str | None = None


class TrackerFinding(StrictModel):
    tracker_id: str
    name: str
    category: Literal["advertising", "profiling", "analytics", "crash_reporting"]
    signature_type: str
    evidence: str
    confidence: Literal["high", "medium", "low"]
    source: str
    attribution: str
    limitation: str


class SecurityFinding(StrictModel):
    id: str
    title: str
    detail: str
    status: Literal["finding_detected", "checked_clean", "platform_default", "unassessed"] | None = None
    severity: Literal["warning", "info", "clean"] | None = None


class Deduction(StrictModel):
    domain: Literal["permissions", "trackers", "security"]
    item: str
    points: float = Field(ge=0)
    explanation: str


class RevokeStep(StrictModel):
    permission: str
    steps: list[str]


class PermissionMetrics(StrictModel):
    total_requested: int
    classified: int
    unclassified: int
    needing_review: int
    unusual: int
    high_risk: int


class AnalysisReport(StrictModel):
    scan_id: str
    package_name: str
    app_name: str | None
    version_name: str | None
    version_code: int | None
    min_sdk: int | None
    target_sdk: int | None
    compile_sdk: int | None
    category: str
    permissions: list[PermissionFinding]
    permission_metrics: PermissionMetrics | None = None
    trackers: list[TrackerFinding]
    security_findings: list[SecurityFinding]
    score: int = Field(ge=0, le=100)
    grade: Literal["Good", "Fair", "Risky", "Poor"]
    deductions: list[Deduction]
    revoke_steps: list[RevokeStep]
    limitations: list[str]
    privacy_xray: "PrivacyXRayReport | None" = None
    passport: "PrivacyPassport | None" = None
    attack_surface: "AttackSurfaceReport | None" = None
    nutrition_label: "PrivacyNutritionLabel | None" = None


# ==================== FEATURE 1: PRIVACY X-RAY MODELS ====================

class XRayEvidenceRecord(StrictModel):
    dex_file: str
    caller_class: str
    caller_method: str
    caller_descriptor: str | None = None
    referenced_api_class: str
    referenced_method: str
    method_descriptor: str | None = None
    instruction_name: str
    instruction_offset: int | None = None
    permission: str
    description: str
    source: str
    evidence_level: Literal["direct_method_reference", "indirect_association", "inconclusive"] = "direct_method_reference"


class PermissionXRayFinding(StrictModel):
    permission: str
    status: Literal["api_reference_found", "no_reference_observed", "not_assessed"]
    evidence: list[XRayEvidenceRecord] = Field(default_factory=list)
    summary: str


class PrivacyXRayReport(StrictModel):
    total_permissions_examined: int
    permissions_with_references: int
    permissions_no_reference_observed: int
    permissions_not_assessed: int
    findings: list[PermissionXRayFinding]
    dex_coverage: list[str]
    mapping_version: str
    limitations: list[str]


# ==================== FEATURE 2: PRIVACY UPDATE RADAR MODELS ====================

class AppMetadataDelta(StrictModel):
    old_value: Any
    new_value: Any
    status: Literal["unchanged", "modified"]


class RadarMetadataDiff(StrictModel):
    package_name: AppMetadataDelta
    app_name: AppMetadataDelta
    version_name: AppMetadataDelta
    version_code: AppMetadataDelta
    min_sdk: AppMetadataDelta
    target_sdk: AppMetadataDelta
    compile_sdk: AppMetadataDelta
    apk_sha256: AppMetadataDelta


class PermissionChangeItem(StrictModel):
    name: str
    risk: str
    category_classification: str
    grant_mechanism: str | None = None
    change_type: Literal["added", "removed", "modified", "unchanged"]
    details: str | None = None


class TrackerChangeItem(StrictModel):
    tracker_id: str
    name: str
    category: str
    change_type: Literal["added", "removed"]


class SecurityChangeItem(StrictModel):
    id: str
    title: str
    old_status: str | None = None
    new_status: str | None = None
    status: Literal["added_risk", "resolved_risk", "unchanged"]
    detail: str


class ScoreChange(StrictModel):
    old_score: int
    new_score: int
    difference: int
    old_grade: str
    new_grade: str
    explanation: str


class RadarComparisonReport(StrictModel):
    comparison_id: str
    package_name: str
    old_version_label: str
    new_version_label: str
    category: str
    metadata_diff: RadarMetadataDiff
    added_permissions: list[PermissionChangeItem]
    removed_permissions: list[PermissionChangeItem]
    retained_permissions_count: int
    new_trackers: list[TrackerChangeItem]
    removed_trackers: list[TrackerChangeItem]
    retained_trackers_count: int
    security_changes: list[SecurityChangeItem]
    score_change: ScoreChange
    old_deductions: list[Deduction]
    new_deductions: list[Deduction]
    summary_text: str
    knowledge_base_fingerprint: str
    limitations: list[str]


# ==================== FEATURE 3: PRIVACY PASSPORT MODELS ====================

class CanonicalPassportPayload(StrictModel):
    passport_id: str
    issued_at_utc: str
    apk_sha256: str
    package_name: str
    app_name: str | None = None
    version_name: str | None = None
    version_code: int | None = None
    min_sdk: int | None = None
    target_sdk: int | None = None
    compile_sdk: int | None = None
    category: str
    score: int
    grade: str
    deductions: list[Deduction]
    permissions: list[PermissionFinding]
    trackers: list[TrackerFinding]
    security_findings: list[SecurityFinding]
    xray_summary: dict[str, int]
    analyzer_version: str
    commit_identifier: str | None = None
    methodology_version: str
    dataset_fingerprints: dict[str, str]
    limitations: list[str]


class PrivacyPassport(StrictModel):
    schema_version: str = "1.0.0"
    passport_id: str
    issued_at_utc: str
    canonical_payload_sha256: str
    signature: str | None = None
    public_key_fingerprint: str | None = None
    is_signed: bool
    qr_integrity_data: str
    qr_png_base64: str | None = None
    payload: CanonicalPassportPayload


class PassportVerifyRequest(StrictModel):
    passport: PrivacyPassport


class PassportVerifyResponse(StrictModel):
    is_valid: bool
    payload_hash_match: bool
    signature_valid: bool | None = None
    trusted_signer: bool
    message: str
    fingerprint: str | None = None


# ==================== FEATURE 4: ATTACK SURFACE MODELS ====================

class AndroidComponentFinding(StrictModel):
    component_type: Literal["activity", "service", "receiver", "provider"]
    name: str
    is_exported: bool
    permission: str | None = None
    has_intent_filter: bool
    grant_uri_permissions: bool = False
    access_classification: Literal[
        "externally_accessible",
        "protected_by_permission",
        "internal_non_exported",
        "requires_review",
        "not_assessed",
    ]
    risk_level: Literal["high", "medium", "low", "info"]
    explanation: str
    remediation_hint: str | None = None


class AttackSurfaceReport(StrictModel):
    total_components: int
    exported_count: int
    protected_count: int
    unprotected_count: int
    activities_count: int
    services_count: int
    receivers_count: int
    providers_count: int
    components: list[AndroidComponentFinding]
    summary: str
    limitations: list[str]


# ==================== FEATURE 5: PRIVACY NUTRITION LABEL MODELS ====================

class PrivacyNutritionSection(StrictModel):
    category_id: str
    title: str
    status: Literal["active_evidence", "declared_capability", "not_detected"]
    evidence_type: Literal["dex_api_callsite", "manifest_permission", "tracker_signature", "component_exposure", "none"]
    badge_label: str
    details: str
    consequences_summary: str
    suggested_action: str | None = None


class PrivacyNutritionLabel(StrictModel):
    package_name: str
    app_name: str | None = None
    score: int
    grade: str
    sections: list[PrivacyNutritionSection]
    key_takeaways: list[str]
    limitations_notice: str
