# Android Privacy Auditor — Quality, Security & Accuracy Audit

**Audit Date**: October 30, 2026  
**Auditor**: Primary Engineering & Security Research Team  
**Baseline Git Commit**: `21c6025`  
**Target Working Directory**: `/home/admin/android-privacy-auditor`

---

## 1. Executive Summary

A comprehensive line-by-line audit of the backend analyzer, knowledge bases, scoring engine, API contract, and frontend interface revealed several structural gaps that directly caused the anomalies observed in recent application scans (such as the Aptoide APK scan):

1. **Permission Knowledge Base Deficit (Critical)**: `data/permissions.json` contained only 33 permissions. In modern Android applications (such as Aptoide `cm.aptoide.pt` targeting Android 15 / API 35), 21 out of 29 declared permissions were completely absent from the database, leading to widespread "Unknown" classifications.
2. **Missing Category Baseline (High)**: `data/categories.json` lacked an `app_store` (`App Store / Marketplace`) category. Scanning an app store under `social` misclassified installer and package management permissions as "Unusual".
3. **Empty Tracker Signature Database (High)**: `data/trackers.json` was an empty JSON object (`{}`), causing the analyzer to report zero tracker matches on all APKs regardless of their embedded SDKs.
4. **Signature Bytecode Matching Impedance (High)**: `analyzer.py` extracted DEX class names in Dalvik descriptor notation (`Lcom/pkg/Class;`) while tracker signatures are typically authored in Java dotted format (`com.pkg.Class`). Without bidirectional normalization, class prefix matching fails across multiple DEX files.
5. **Ambiguous Permission Metrics & Badge Semantics (Medium)**: The UI conflated "Unusual" permissions with "Critical" risk to calculate "Flagged permissions", while unclassified permissions lacked distinct categorization, metric accounting, and neutral styling.
6. **Security Hygiene Reporting Gaps (Medium)**: The analyzer checked only three manifest flags (`debuggable`, `cleartext`, and `target_sdk < 30`), without evaluating `android:allowBackup` or presenting structured evaluation statuses (Checked No Issue, Finding Detected, Default).
7. **Malware & Antivirus Disclaimer Absence (Medium)**: The report did not explicitly inform users that static privacy auditing is not a malware or antivirus scan.

---

## 2. Detailed Findings & Severity Matrix

| ID | Component | Severity | Description | Planned Remedy |
|---|---|---|---|---|
| **AUD-01** | `data/permissions.json` | **Critical** | Database contains only 33 permissions. Missing Android 10-15 permissions (`POST_NOTIFICATIONS`, `ACCESS_ADSERVICES_*`, `FOREGROUND_SERVICE_*`, `QUERY_ALL_PACKAGES`, `REQUEST_INSTALL_PACKAGES`, `UPDATE_PACKAGES_WITHOUT_USER_ACTION`, `USE_BIOMETRIC`, Google/Play permissions, and OEM/custom permissions). | Expand to a comprehensive Android permission dataset based on official Android Developer documentation (`Manifest.permission`), defining protection level, runtime status, risk, group, description, and source URL. |
| **AUD-02** | `analyzer/app/analyzer.py` | **High** | Unknown permissions were assigned `"Unknown"` risk and `"Unknown"` category classification. Any known permission absent from sparse category rules defaulted to `"Unusual"` (1.5x penalty multiplier). | Assign `Unclassified` to unlisted permissions. Separate Android protection level from category fit. Never penalize unclassified permissions. |
| **AUD-03** | `data/categories.json` | **High** | Only 8 categories existed. Missing `app_store` (`App Store / Marketplace`), `shopping`, `gaming`, `health_fitness`, `education`, `productivity`, and `communication`. Sparse permission rules caused false-positive "Unusual" classifications. | Add `app_store` and expanded standard categories with realistic permission expectation maps (`Expected`, `Review`, `Unusual`). |
| **AUD-04** | `data/trackers.json` | **Critical** | Database was empty (`{}`). Zero trackers could be detected. | Import verified Exodus Privacy tracker dataset with attribution, open-source licensing, category, website, and signature prefixes. |
| **AUD-05** | `analyzer/app/analyzer.py` | **High** | DEX class matching did not normalize between Dalvik bytecode format (`Lcom/google/android/gms/...;`) and dotted package signatures, risking false negatives across multidex files (`classes.dex`, `classes2.dex`, etc.). | Implement robust DEX class prefix normalization and multi-DEX deduplication. |
| **AUD-06** | `web/app/report/page.tsx` | **Medium** | "Flagged permissions" metric was calculated as `Unusual || Critical`, which counted benign permissions as flagged when category rules were incomplete. Unclassified permissions had no distinct metric. | Introduce distinct, synchronized counts: Total Requested, Classified, Unclassified, Needing Review, Unusual, and High-Risk. |
| **AUD-07** | `analyzer/app/scoring.py` | **Medium** | Score explanations and domain deductions needed strict mathematical alignment with itemized penalties. Caps must be uniformly explained. | Verify that itemized deduction points sum exactly to domain totals and final clamped score. Retain deterministic scoring formulas. |
| **AUD-08** | `analyzer/app/analyzer.py` | **Medium** | Security hygiene only checked `debuggable`, `cleartextTraffic`, and `target_sdk`. Missing `allowBackup` check and explicit status for checked items. | Add `android:allowBackup` check and return explicit status for all assessed hygiene items. |
| **AUD-09** | `web/app/report/page.tsx` | **Medium** | Missing explicit malware disclaimer. Risk of users mistaking a static privacy score for a clean bill of health or antivirus pass. | Add dedicated assessment card: **"Malware scan not performed"** clearly explaining static privacy auditor boundaries. |
| **AUD-10** | `web/app/report/page.tsx` | **Medium** | Permission list lacked search and category filtering for apps declaring 20-50+ permissions. | Add interactive search bar and status filter tabs (`All`, `Flagged`, `Review`, `Expected`, `Unclassified`). |

---

## 3. Remediation Roadmap

1. **Phase 2 (Permissions)**:
   - Build a verified Android permission knowledge base in `data/permissions.json` covering framework runtime, normal, signature, install-time, and ad-services permissions.
   - Refactor `analyzer.py` to classify unrecognized permissions as `Unclassified` with 0 risk penalty.
   - Add granular permission metrics to API models and frontend.
2. **Phase 3 (Categories)**:
   - Add `app_store` and extended categories (`shopping`, `gaming`, `health_fitness`, `education`, `productivity`, `communication`) to `data/categories.json`.
   - Synchronize category selectors in `web/lib/api.ts`, `web/app/scanner/page.tsx`, `analyzer/app/main.py`.
3. **Phase 4 (Trackers)**:
   - Compile verified tracker signatures from Exodus Privacy into `data/trackers.json`.
   - Licensing distinction: Exodus platform code is licensed under GNU AGPL v3; the tracker database and API dataset are licensed under the Open Database License (ODbL) v1.0 and Database Contents License (DBCL) v1.0 with attribution to Exodus Privacy.
   - Implement multi-DEX class normalization supporting both Dalvik descriptor and Java dotted formats.
   - Ensure truthful empty-state disclaimers when zero signatures match.
4. **Phase 5 & 6 (Scoring & Security)**:
   - Retain deterministic scoring formulas while validating bounds, caps, and itemized deduction sums.
   - Add `allowBackup` check and structured security finding states.
5. **Phase 7 & 10 (Frontend & UX)**:
   - Add "Malware scan not performed" card.
   - Add permission search & filter controls.
   - Refine score card with explicit heuristic labeling.
6. **Phase 8 & 11 (Verification & Aptoide Test)**:
   - Analyze the exact Aptoide APK (`~/Downloads/viruses-24hours.apk`, SHA-256 `cd3a042bb...`) under the new `app_store` category.
   - Run all pytest backend tests, frontend build, and backup exclusion tests.
