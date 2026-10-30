"""Strict API response models."""
from typing import Literal

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
