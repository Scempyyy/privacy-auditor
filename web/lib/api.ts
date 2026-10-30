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
  analyzed_at?: string;
  is_demo?: boolean;
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
  analyzed_at: "Demo Example Fixture",
};
