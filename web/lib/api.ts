/**
 * Android Privacy Auditor — Frontend API Client & Data Models
 * Communicates with the FastAPI backend service over HTTP REST.
 */

export type AppCategory =
  | "app_store"
  | "social"
  | "messaging"
  | "finance"
  | "navigation"
  | "camera"
  | "photo_video"
  | "weather"
  | "shopping"
  | "gaming"
  | "health_fitness"
  | "education"
  | "productivity"
  | "communication"
  | "utility";

export const CATEGORY_OPTIONS: { value: AppCategory; label: string }[] = [
  { value: "app_store", label: "App Store / Marketplace" },
  { value: "social", label: "Social Networking" },
  { value: "messaging", label: "Messaging & Chat" },
  { value: "finance", label: "Finance & Banking" },
  { value: "navigation", label: "Navigation & Maps" },
  { value: "camera", label: "Camera & Imaging" },
  { value: "photo_video", label: "Photo & Video Editing" },
  { value: "weather", label: "Weather Forecasts" },
  { value: "shopping", label: "Shopping & E-Commerce" },
  { value: "gaming", label: "Gaming" },
  { value: "health_fitness", label: "Health & Fitness" },
  { value: "education", label: "Education & Learning" },
  { value: "productivity", label: "Productivity & Office" },
  { value: "communication", label: "Communication & Calling" },
  { value: "utility", label: "Utilities & Tools" },
];

export type PermissionFinding = {
  name: string;
  protection_level?: string | null;
  platform_protection_level?: string | null;
  grant_mechanism?: "runtime" | "install_time" | "special_app_access" | "signature_restricted" | "unclassified" | null;
  risk: "Critical" | "High" | "Moderate" | "Low" | "Unclassified" | "Unknown";
  category_classification: "Expected" | "Review" | "Unusual" | "Unclassified" | "Unknown";
  group: string | null;
  explanation: string;
  source: string | null;
  is_runtime?: boolean | null;
  user_impact?: string | null;
};

export type TrackerFinding = {
  tracker_id: string;
  name: string;
  category: "advertising" | "profiling" | "analytics" | "crash_reporting";
  signature_type: string;
  evidence: string;
  confidence: "high" | "medium" | "low";
  source: string;
  attribution: string;
  limitation: string;
};

export type SecurityFinding = {
  id: string;
  title: string;
  detail: string;
  status?: "finding_detected" | "checked_clean" | "platform_default" | "unassessed";
  severity?: "warning" | "info" | "clean";
};

export type Deduction = {
  domain: "permissions" | "trackers" | "security";
  item: string;
  points: number;
  explanation: string;
};

export type RevokeStep = {
  permission: string;
  steps: string[];
};

export type PermissionMetrics = {
  total_requested: number;
  classified: number;
  unclassified: number;
  needing_review: number;
  unusual: number;
  high_risk: number;
};

// ==================== FEATURE 1: PRIVACY X-RAY TYPES ====================

export type XRayEvidenceRecord = {
  dex_file: string;
  caller_class: string;
  caller_method: string;
  caller_descriptor?: string | null;
  referenced_api_class: string;
  referenced_method: string;
  method_descriptor?: string | null;
  instruction_name: string;
  instruction_offset?: number | null;
  permission: string;
  description: string;
  source: string;
  evidence_level: "direct_method_reference" | "indirect_association" | "inconclusive";
};

export type PermissionXRayFinding = {
  permission: string;
  status: "api_reference_found" | "no_reference_observed" | "not_assessed";
  evidence: XRayEvidenceRecord[];
  summary: string;
};

export type PrivacyXRayReport = {
  total_permissions_examined: number;
  permissions_with_references: number;
  permissions_no_reference_observed: number;
  permissions_not_assessed: number;
  findings: PermissionXRayFinding[];
  dex_coverage: string[];
  mapping_version: string;
  limitations: string[];
};

// ==================== FEATURE 2: PRIVACY UPDATE RADAR TYPES ====================

export type AppMetadataDelta = {
  old_value: any;
  new_value: any;
  status: "unchanged" | "modified";
};

export type RadarMetadataDiff = {
  package_name: AppMetadataDelta;
  app_name: AppMetadataDelta;
  version_name: AppMetadataDelta;
  version_code: AppMetadataDelta;
  min_sdk: AppMetadataDelta;
  target_sdk: AppMetadataDelta;
  compile_sdk: AppMetadataDelta;
  apk_sha256: AppMetadataDelta;
};

export type PermissionChangeItem = {
  name: string;
  risk: string;
  category_classification: string;
  grant_mechanism?: string | null;
  change_type: "added" | "removed" | "modified" | "unchanged";
  details?: string | null;
};

export type TrackerChangeItem = {
  tracker_id: string;
  name: string;
  category: string;
  change_type: "added" | "removed";
};

export type SecurityChangeItem = {
  id: string;
  title: string;
  old_status?: string | null;
  new_status?: string | null;
  status: "added_risk" | "resolved_risk" | "unchanged";
  detail: string;
};

export type ScoreChange = {
  old_score: number;
  new_score: number;
  difference: number;
  old_grade: string;
  new_grade: string;
  explanation: string;
};

export type RadarComparisonReport = {
  comparison_id: string;
  package_name: string;
  old_version_label: string;
  new_version_label: string;
  category: string;
  metadata_diff: RadarMetadataDiff;
  added_permissions: PermissionChangeItem[];
  removed_permissions: PermissionChangeItem[];
  retained_permissions_count: number;
  new_trackers: TrackerChangeItem[];
  removed_trackers: TrackerChangeItem[];
  retained_trackers_count: number;
  security_changes: SecurityChangeItem[];
  score_change: ScoreChange;
  old_deductions: Deduction[];
  new_deductions: Deduction[];
  summary_text: string;
  knowledge_base_fingerprint: string;
  limitations: string[];
};

// ==================== FEATURE 3: PRIVACY PASSPORT TYPES ====================

export type CanonicalPassportPayload = {
  passport_id: string;
  issued_at_utc: string;
  apk_sha256: string;
  package_name: string;
  app_name?: string | null;
  version_name?: string | null;
  version_code?: number | null;
  min_sdk?: number | null;
  target_sdk?: number | null;
  compile_sdk?: number | null;
  category: string;
  score: number;
  grade: string;
  deductions: Deduction[];
  permissions: PermissionFinding[];
  trackers: TrackerFinding[];
  security_findings: SecurityFinding[];
  xray_summary: Record<string, number>;
  analyzer_version: string;
  commit_identifier?: string | null;
  methodology_version: string;
  dataset_fingerprints: Record<string, string>;
  limitations: string[];
};

export type PrivacyPassport = {
  schema_version: string;
  passport_id: string;
  issued_at_utc: string;
  canonical_payload_sha256: string;
  signature?: string | null;
  public_key_fingerprint?: string | null;
  is_signed: boolean;
  qr_integrity_data: string;
  qr_png_base64?: string | null;
  payload: CanonicalPassportPayload;
};

export type PassportVerifyResponse = {
  is_valid: boolean;
  payload_hash_match: boolean;
  signature_valid?: boolean | null;
  trusted_signer: boolean;
  message: string;
  fingerprint?: string | null;
};

// ==================== FEATURE 4: ATTACK SURFACE TYPES ====================

export type AndroidComponentFinding = {
  component_type: "activity" | "service" | "receiver" | "provider";
  name: string;
  is_exported: boolean;
  permission?: string | null;
  has_intent_filter: boolean;
  grant_uri_permissions: boolean;
  access_classification: "externally_accessible" | "protected_by_permission" | "internal_non_exported" | "requires_review" | "not_assessed";
  risk_level: "high" | "medium" | "low" | "info";
  explanation: string;
  remediation_hint?: string | null;
};

export type AttackSurfaceReport = {
  total_components: number;
  exported_count: number;
  protected_count: number;
  unprotected_count: number;
  activities_count: number;
  services_count: number;
  receivers_count: number;
  providers_count: number;
  components: AndroidComponentFinding[];
  summary: string;
  limitations: string[];
};

// ==================== FEATURE 5: PRIVACY NUTRITION LABEL TYPES ====================

export type PrivacyNutritionSection = {
  category_id: string;
  title: string;
  status: "active_evidence" | "declared_capability" | "not_detected";
  evidence_type: "dex_api_callsite" | "manifest_permission" | "tracker_signature" | "component_exposure" | "none";
  badge_label: string;
  details: string;
  consequences_summary: string;
  suggested_action?: string | null;
};

export type PrivacyNutritionLabel = {
  package_name: string;
  app_name?: string | null;
  score: number;
  grade: string;
  sections: PrivacyNutritionSection[];
  key_takeaways: string[];
  limitations_notice: string;
};

export type AnalysisReport = {
  scan_id: string;
  package_name: string;
  app_name: string | null;
  version_name: string | null;
  version_code: number | null;
  min_sdk: number | null;
  target_sdk: number | null;
  compile_sdk: number | null;
  category: string;
  permissions: PermissionFinding[];
  permission_metrics?: PermissionMetrics;
  trackers: TrackerFinding[];
  security_findings: SecurityFinding[];
  score: number;
  grade: "Good" | "Fair" | "Risky" | "Poor";
  deductions: Deduction[];
  revoke_steps: RevokeStep[];
  limitations: string[];
  privacy_xray?: PrivacyXRayReport | null;
  passport?: PrivacyPassport | null;
  attack_surface?: AttackSurfaceReport | null;
  nutrition_label?: PrivacyNutritionLabel | null;
  publisher_identity?: PublisherIdentityReport | null;
  privacy_reality?: PrivacyRealityReport | null;
  analyzed_at?: string;
  is_demo?: boolean;
};

// ==================== FEATURE 6: PUBLISHER IDENTITY TYPES ====================

export type SigningCertificateInfo = {
  subject: string;
  issuer: string;
  serial_number: string;
  sha256_fingerprint: string;
  sha1_fingerprint: string;
  valid_from?: string | null;
  valid_until?: string | null;
};

export type NativeLibraryInfo = {
  name: string;
  abi: string;
  path: string;
  size_bytes: number;
};

export type PublisherIdentityReport = {
  is_signed: boolean;
  v1_signing_enabled: boolean;
  v2_signing_enabled: boolean;
  v3_signing_enabled: boolean;
  certificates: SigningCertificateInfo[];
  native_libraries: NativeLibraryInfo[];
  dex_files: string[];
  supported_abis: string[];
  total_files: number;
  total_uncompressed_bytes: number;
  summary: string;
  limitations: string[];
};

// ==================== FEATURE 7: PRIVACY REALITY ENGINE TYPES ====================

export type PrivacyRealityItem = {
  capability_name: string;
  layer1_declared: boolean;
  layer2_statically_referenced: boolean;
  layer3_data_flow_evidence: boolean;
  layer4_runtime_observed: boolean;
  layer5_inconclusive: boolean;
  classification: "declared_and_referenced" | "declared_only_no_static_call" | "referenced_not_declared" | "runtime_observed" | "inconclusive";
  verdict_explanation: string;
  callsites_count: number;
  callsites_sample: string[];
};

export type PrivacyRealityReport = {
  package_name: string;
  total_capabilities_assessed: number;
  total_statically_referenced: number;
  total_declared_only: number;
  total_data_flow_traced: number;
  total_runtime_observed: number;
  items: PrivacyRealityItem[];
  summary: string;
  limitations: string[];
};

// ==================== FEATURE 8: BENCHMARK SUITE TYPES ====================

export type BenchmarkCaseResult = {
  case_id: string;
  title: string;
  scenario: string;
  status: "passed" | "failed" | "unassessed";
  expected_outcome: string;
  actual_outcome: string;
  ground_truth_alignment: string;
};

export type BenchmarkSuiteReport = {
  total_cases: number;
  passed_cases: number;
  failed_cases: number;
  accuracy_rate: number;
  cases: BenchmarkCaseResult[];
  summary: string;
  limitations: string[];
};

// ==================== FEATURE 9: DYNAMIC SANDBOX TYPES ====================

export type SandboxTimelineEvent = {
  timestamp_offset_ms: number;
  event_type: "lifecycle" | "api_call" | "network" | "service";
  description: string;
  evidence_source: string;
};

export type DynamicSandboxStatusReport = {
  is_available: boolean;
  is_enabled: boolean;
  adb_installed: boolean;
  emulator_installed: boolean;
  java_installed: boolean;
  frida_installed: boolean;
  active_disposable_devices: string[];
  status_message: string;
  safety_controls_enforced: string[];
  sample_timeline: SandboxTimelineEvent[];
};

// Next.js client-side public base URL
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_ANALYZER_URL ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

/**
 * Check if the FastAPI backend service is responding at /health.
 */
export async function checkApiHealth(): Promise<boolean> {
  const url = `${API_BASE_URL}/health`;
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.status === "ok";
  } catch {
    return false;
  }
}

/**
 * Submit an APK file to the backend for static privacy analysis.
 */
export async function analyzeApk(
  file: File,
  category: string
): Promise<AnalysisReport> {
  const body = new FormData();
  body.append("file", file);
  body.append("category", category);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
      method: "POST",
      body,
    });
  } catch (err) {
    throw new Error(
      `Analyzer backend unreachable at ${API_BASE_URL}. Ensure the backend service is running.`
    );
  }

  if (!response.ok) {
    let errorMessage = `Analysis request failed (HTTP ${response.status}).`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorMessage =
          typeof errJson.detail === "string"
            ? errJson.detail
            : JSON.stringify(errJson.detail);
      }
    } catch {
      const text = await response.text();
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  const report = (await response.json()) as AnalysisReport;
  report.analyzed_at = new Date().toISOString();
  report.is_demo = false;
  return report;
}

/**
 * Compare two versions of an application package.
 */
export async function compareApkVersions(
  oldFile: File,
  newFile: File,
  category: string
): Promise<RadarComparisonReport> {
  const body = new FormData();
  body.append("old_file", oldFile);
  body.append("new_file", newFile);
  body.append("category", category);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/compare`, {
      method: "POST",
      body,
    });
  } catch (err) {
    throw new Error(
      `Analyzer backend unreachable at ${API_BASE_URL}. Ensure the backend service is running.`
    );
  }

  if (!response.ok) {
    let errorMessage = `Comparison request failed (HTTP ${response.status}).`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorMessage =
          typeof errJson.detail === "string"
            ? errJson.detail
            : JSON.stringify(errJson.detail);
      }
    } catch {
      const text = await response.text();
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as RadarComparisonReport;
}

/**
 * Verify a Privacy Passport JSON payload.
 */
export async function verifyPassportApi(
  passport: PrivacyPassport
): Promise<PassportVerifyResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1/passport/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ passport }),
    });
  } catch (err) {
    throw new Error(
      `Analyzer backend unreachable at ${API_BASE_URL}. Ensure the backend service is running.`
    );
  }

  if (!response.ok) {
    let errorMessage = `Verification request failed (HTTP ${response.status}).`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorMessage =
          typeof errJson.detail === "string"
            ? errJson.detail
            : JSON.stringify(errJson.detail);
      }
    } catch {
      const text = await response.text();
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as PassportVerifyResponse;
}

/**
 * Fetch the ground-truth benchmark suite evaluation report.
 */
export async function fetchBenchmarkSuiteApi(): Promise<BenchmarkSuiteReport> {
  const res = await fetch(`${API_BASE_URL}/api/v1/benchmark`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Benchmark API error (${res.status})`);
  return (await res.json()) as BenchmarkSuiteReport;
}

/**
 * Fetch dynamic sandbox safety controls and environment status.
 */
export async function fetchSandboxStatusApi(): Promise<DynamicSandboxStatusReport> {
  const res = await fetch(`${API_BASE_URL}/api/v1/sandbox/status`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Sandbox status API error (${res.status})`);
  return (await res.json()) as DynamicSandboxStatusReport;
}

/**
 * Curated Demo Sample Report (Explicitly tagged as DEMO DATA).
 */
export const DEMO_REPORT: AnalysisReport = {
  scan_id: "demo-sample-001",
  package_name: "com.example.socialsample",
  app_name: "Sample Social App",
  version_name: "4.2.1",
  version_code: 421,
  min_sdk: 26,
  target_sdk: 34,
  compile_sdk: 34,
  category: "social",
  is_demo: true,
  score: 68,
  grade: "Fair",
  permission_metrics: {
    total_requested: 5,
    classified: 5,
    unclassified: 0,
    needing_review: 3,
    unusual: 1,
    high_risk: 4,
  },
  permissions: [
    {
      name: "android.permission.INTERNET",
      risk: "Low",
      category_classification: "Expected",
      group: "NETWORK",
      explanation: "Allows the application to open network sockets for communication.",
      source: "data/permissions.json",
    },
    {
      name: "android.permission.CAMERA",
      risk: "High",
      category_classification: "Review",
      group: "CAMERA",
      explanation: "Common for sharing photos and video. Access should be requested only when camera is in use.",
      source: "data/permissions.json",
    },
    {
      name: "android.permission.ACCESS_FINE_LOCATION",
      risk: "High",
      category_classification: "Unusual",
      group: "LOCATION",
      explanation: "Precise GPS location can reveal where you live and travel. Unusual for non-navigation apps.",
      source: "data/permissions.json",
    },
    {
      name: "android.permission.READ_CONTACTS",
      risk: "High",
      category_classification: "Review",
      group: "CONTACTS",
      explanation: "Exposes address book contacts. Consider whether contact syncing is required.",
      source: "data/permissions.json",
    },
    {
      name: "android.permission.RECORD_AUDIO",
      risk: "High",
      category_classification: "Review",
      group: "MICROPHONE",
      explanation: "Can capture microphone audio while in use for voice messaging or video recording.",
      source: "data/permissions.json",
    },
  ],
  trackers: [
    {
      tracker_id: "google_admob",
      name: "Google AdMob",
      category: "advertising",
      signature_type: "dex_class",
      evidence: "com.google.android.gms.ads",
      confidence: "high",
      source: "data/trackers.json",
      attribution: "Google LLC / Alphabet Inc.",
      limitation: "Embedded ad serving framework detected via class bytecode.",
    },
    {
      tracker_id: "firebase_analytics",
      name: "Firebase Analytics",
      category: "analytics",
      signature_type: "dex_class",
      evidence: "com.google.firebase.analytics",
      confidence: "high",
      source: "data/trackers.json",
      attribution: "Google LLC",
      limitation: "Telemetry and event tracking SDK.",
    },
  ],
  security_findings: [
    {
      id: "cleartext_traffic",
      title: "Permissive Cleartext Network Traffic",
      detail: "Application manifest permits unencrypted HTTP connections (android:usesCleartextTraffic=true).",
    },
    {
      id: "target_sdk_valid",
      title: "Modern Target SDK",
      detail: "Targets modern Android API level with runtime permission model.",
    },
  ],
  deductions: [
    {
      domain: "permissions",
      item: "ACCESS_FINE_LOCATION (High risk, Unusual for category)",
      points: 9,
      explanation: "Base penalty 6 × 1.5 unusual category multiplier = 9.0 points.",
    },
    {
      domain: "permissions",
      item: "CAMERA (High risk, Review)",
      points: 6,
      explanation: "Base penalty 6 × 1.0 category multiplier = 6.0 points.",
    },
    {
      domain: "permissions",
      item: "READ_CONTACTS (High risk, Review)",
      points: 6,
      explanation: "Base penalty 6 × 1.0 category multiplier = 6.0 points.",
    },
    {
      domain: "trackers",
      item: "Google AdMob (Advertising SDK)",
      points: 4,
      explanation: "4 points deducted per detected advertising framework.",
    },
    {
      domain: "trackers",
      item: "Firebase Analytics (Analytics SDK)",
      points: 2,
      explanation: "2 points deducted per analytics tracking framework.",
    },
    {
      domain: "security",
      item: "Cleartext Traffic Allowed",
      points: 5,
      explanation: "Insecure network transmission allowed in AndroidManifest.xml.",
    },
  ],
  revoke_steps: [
    {
      permission: "android.permission.ACCESS_FINE_LOCATION",
      steps: [
        "Open Android Settings → Apps → Sample Social App → Permissions.",
        "Choose Location and select 'Don’t allow' or 'Allow only while using the app'.",
      ],
    },
    {
      permission: "android.permission.READ_CONTACTS",
      steps: [
        "Open Android Settings → Privacy → Permission manager → Contacts.",
        "Locate 'Sample Social App' and toggle access to Off.",
      ],
    },
  ],
  limitations: [
    "DEMO DATA: This is an illustrative sample fixture, not an analysis of a real APK.",
    "Static analysis inspects package manifests and DEX bytecode signatures; runtime network traffic is not observed.",
    "Tracker signature databases reflect known SDKs and may miss newly developed or obfuscated tracking libraries.",
  ],
  attack_surface: {
    total_components: 12,
    exported_count: 4,
    protected_count: 3,
    unprotected_count: 1,
    activities_count: 6,
    services_count: 3,
    receivers_count: 2,
    providers_count: 1,
    summary: "12 manifest components inspected. 1 component is exported without permission guards.",
    limitations: ["Dynamic receiver registrations and runtime reflection are not assessed in manifest parsing."],
    components: [
      {
        name: "com.example.social.MainActivity",
        component_type: "activity",
        is_exported: true,
        permission: null,
        has_intent_filter: true,
        grant_uri_permissions: false,
        access_classification: "externally_accessible",
        risk_level: "low",
        explanation: "Main application launch point exported via launcher intent filter.",
        remediation_hint: "Standard entry point. Ensure sensitive data is not accepted via unvalidated launch intents.",
      },
      {
        name: "com.example.social.ShareReceiver",
        component_type: "receiver",
        is_exported: true,
        permission: null,
        has_intent_filter: true,
        grant_uri_permissions: false,
        access_classification: "externally_accessible",
        risk_level: "high",
        explanation: "Exported broadcast receiver without permission protection. Any app can send intents to this receiver.",
        remediation_hint: "Set android:exported=\"false\" or guard with android:permission with signature protection.",
      },
      {
        name: "com.example.social.BackgroundSyncService",
        component_type: "service",
        is_exported: true,
        permission: "android.permission.BIND_JOB_SERVICE",
        has_intent_filter: true,
        grant_uri_permissions: false,
        access_classification: "protected_by_permission",
        risk_level: "low",
        explanation: "JobScheduler service guarded by android.permission.BIND_JOB_SERVICE.",
        remediation_hint: "Properly guarded by system service permission.",
      },
      {
        name: "com.example.social.DataProvider",
        component_type: "provider",
        is_exported: false,
        permission: null,
        has_intent_filter: false,
        grant_uri_permissions: false,
        access_classification: "internal_non_exported",
        risk_level: "low",
        explanation: "Internal private content provider.",
        remediation_hint: null,
      },
    ],
  },
  nutrition_label: {
    package_name: "com.example.social",
    app_name: "Sample Social App",
    score: 68,
    grade: "D",
    sections: [
      {
        category_id: "location",
        title: "Precise Geographic Location",
        status: "active_evidence",
        evidence_type: "dex_api_callsite",
        badge_label: "Active Dex Call",
        details: "Bytecode calls LocationManager.getLastKnownLocation directly.",
        consequences_summary: "Third-party ad networks or application logic can track your physical whereabouts.",
        suggested_action: "Revoke location access in Android Settings if not needed for core function.",
      },
      {
        category_id: "identity",
        title: "Contact & Address Book Access",
        status: "declared_capability",
        evidence_type: "manifest_permission",
        badge_label: "Permission Declared",
        details: "Requests READ_CONTACTS permission in manifest.",
        consequences_summary: "Allows reading names, phone numbers, and emails of personal contacts.",
        suggested_action: "Grant only when actively syncing contacts.",
      },
      {
        category_id: "trackers",
        title: "Commercial Telemetry & Ad SDKs",
        status: "active_evidence",
        evidence_type: "tracker_signature",
        badge_label: "2 SDKs Present",
        details: "Google AdMob and Firebase Analytics signatures matched in DEX bytecode.",
        consequences_summary: "Device identifiers and behavioral events transmitted to third-party ad networks.",
        suggested_action: "Use a private DNS or tracker blocker to mitigate background telemetry.",
      },
      {
        category_id: "attack_surface",
        title: "IPC Attack Surface Exposure",
        status: "active_evidence",
        evidence_type: "component_exposure",
        badge_label: "1 Unguarded Component",
        details: "ShareReceiver is exported with no permission guard.",
        consequences_summary: "Malicious apps installed on the device could invoke this component.",
        suggested_action: "Developer should mark component exported=false.",
      },
    ],
    key_takeaways: [
      "App accesses precise physical location and contacts.",
      "Embedded advertising and analytics libraries track user events.",
      "At least 1 broadcast receiver is accessible to any other app on the device.",
    ],
    limitations_notice: "Generated via static analysis of manifest declarations, DEX bytecode references, and Exodus signatures.",
  },
  analyzed_at: "Demo Example Fixture",
};
