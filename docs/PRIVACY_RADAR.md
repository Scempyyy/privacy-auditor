# Privacy Update Radar: Comparative Privacy Posture

## 1. Overview
Privacy Update Radar compares two releases of the same Android application package to identify changes in privacy risks, permissions, tracker SDKs, security flags, and heuristic scores.

## 2. Core Comparison Mechanics
- **Endpoint**: `POST /api/v1/compare`
- **Validation**:
  - Enforces independent archive validation and a 150 MB aggregate upload budget.
  - Requires identical package identifiers (`package_name`). Rejects cross-package comparisons with HTTP 400.
  - Detects and rejects identical APK hashes to prevent redundant comparisons.
- **Evaluation Consistency**: Both APKs are evaluated against the **identical** knowledge-base snapshot and scoring formulas during the comparison, ensuring that knowledge base updates are never misattributed as APK changes.

## 3. Differential Report Elements
- **App Metadata**: Package, app name, version name, version code, target SDK, minimum SDK, and SHA-256 digests.
- **Permission Differential**: Newly added permissions, removed/revoked permissions, and retained permission counts.
- **Tracker Differential**: Newly matched tracker signatures, discontinued signatures, and retained tracking frameworks.
- **Security Hygiene Changes**: Manifest cleartext traffic policies and target SDK level shifts.
- **Privacy Score Delta**: Point movement and grade shifts with itemized deduction explanations.
