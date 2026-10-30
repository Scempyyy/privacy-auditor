# Functional Specification: Android Privacy Auditor (MVP)

## 1. Overview & Purpose

The **Android Privacy Auditor** is an open-source, local-first web application designed to evaluate the privacy implications of Android applications (`.apk` files). It performs static analysis on uploaded packages to uncover requested permissions, identify embedded tracking and advertising SDKs, assess basic security configurations, and compute a deterministic, fully explainable privacy score.

---

## 2. Core MVP Requirements

The Minimum Viable Product (MVP) covers the complete end-to-end audit lifecycle across the following functional capabilities:

### Requirement 1: APK Ingestion
- Accept an Android APK file (e.g. `base.apk` or single standalone APKs up to 100 MB).
- Validate file format and ZIP container structure prior to analysis.
- Safely handle corrupted or non-APK files with explicit, informative error messaging.

### Requirement 2: Application Metadata Extraction
- Extract package identity:
  - Application Label / Display Name.
  - Package identifier (e.g., `com.example.app`).
  - Version Code and Version Name.
  - Minimum SDK version (`minSdkVersion`).
  - Target SDK version (`targetSdkVersion`).
  - Compile SDK version (`compileSdkVersion`).

### Requirement 3: Declared Permissions Extraction
- Parse the parsed binary `AndroidManifest.xml` to retrieve all declared permissions (`<uses-permission>`).
- Distinguish between standard Android permissions (`android.permission.*`) and custom/vendor-defined permissions.
- Extract protection levels where defined (Normal, Dangerous, Signature).

### Requirement 4: Category-Aware Permission Classification
- Classify permissions against application category baselines (e.g., Social, Navigation, Utility, Finance).
- Distinguish between permissions that are:
  - **Expected**: Routine permissions for that category (e.g., Camera in a Photo Editor).
  - **Review**: Permissions that warrant attention but may have valid use cases.
  - **Unusual**: Permissions not typical for the declared category that present privacy risks.

### Requirement 5: Tracker & Ad SDK Signature Detection
- Inspect compiled DEX classes and package hierarchies against a curated knowledge base of known tracking, analytics, and advertising SDKs.
- Identify tracker signatures across distinct functional categories:
  - Advertising (e.g., Google AdMob, Unity Ads, AppLovin).
  - Profiling / Location / Identification (e.g., InMobi, Kochava, AppsFlyer).
  - Analytics (e.g., Firebase Analytics, Segment, Mixpanel).
  - Crash Reporting (e.g., Sentry, Firebase Crashlytics).

### Requirement 6: Deterministic Privacy Scoring
- Compute an aggregate privacy score from 0 to 100 using the deterministic formula defined in `SCORING.md`.
- No floating-point ambiguities or non-reproducible calculations.
- Classify scores into four standard rating bands:
  - **Good**: 80–100
  - **Fair**: 60–79
  - **Risky**: 40–59
  - **Poor**: 0–39

### Requirement 7: Transparent Deduction Explanations
- Every single point deducted from the starting score of 100 must be explicitly enumerated in the audit report.
- Deductions must clearly link to the root cause (e.g., specific dangerous permission, tracker SDK found, or manifest security configuration flaw).

### Requirement 8: Permission Revocation & Mitigation Guidance
- Provide device-specific, step-by-step guidance for users to revoke dangerous permissions on modern Android versions (Android 11+ runtime permission manager).
- Provide privacy tips (e.g., "Allow only while using the app", "Ask every time", or alternative open-source recommendations).

### Requirement 9: Pre-Scanned Application Library
- Provide a curated library of at least 10 pre-scanned application reports available immediately upon first launch.
- Allows users to explore auditor findings and scoring breakdowns without needing to supply their own APK files.

---

## 3. Explicitly Deferred Features (Post-MVP)

The following capabilities are deliberately excluded from the MVP scope:
- **User Authentication & Accounts**: No logins, profiles, or authentication layers.
- **Persistent User History**: No server-side session or historical user database.
- **Dynamic Traffic Interception**: No network proxying or runtime TLS inspection.
- **Runtime APK Execution**: No emulation, containerization, or sandboxed execution of APKs.
- **PDF / Export Reports**: Report generation is restricted to the web UI in MVP.
- **Companion Android App**: No on-device Android helper application.
- **Split APK / App Bundle (AAB) Reassembly**: Single base APKs supported initially.
