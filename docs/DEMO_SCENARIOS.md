# Android Privacy Auditor — Live Demonstration Scenarios

This document outlines three reproducible demonstration workflows designed for live judge evaluations.

---

## Scenario 1: Comprehensive APK Audit & Privacy Nutrition Label

**Goal:** Demonstrate the end-to-end audit of a real 22MB Android APK (`cm.aptoide.pt`), inspect the score calculation, and review the Privacy Nutrition Label.

### Steps to Reproduce:
1. Ensure the backend and frontend are running:
   ```bash
   # Terminal 1: Backend
   cd analyzer && .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
   # Terminal 2: Frontend
   cd web && npm run start -- -p 3000
   ```
2. Open browser at `http://localhost:3000/scanner`.
3. Verify that the status indicator says **"Backend online"**.
4. Select category: **"App Store / Marketplace"**.
5. Upload the test APK: `/home/admin/Downloads/viruses-24hours.apk`.
6. Click **"Run Full Privacy Audit"**.
7. Observe the results on `/report`:
   - Score: **55 / 100 (Grade D)**.
   - 31 permissions requested with runtime vs special access badges.
   - Trackers identified with Exodus Privacy attribution.
   - **Privacy Nutrition Label** rendered with status badges, consequence explanations, and print/save PDF capability.
   - Permission remediation steps for revocation in Android Settings.

---

## Scenario 2: Privacy X-Ray Bytecode Tracing & Attack Surface Explorer

**Goal:** Prove that the auditor looks beyond superficial manifest declarations into real Dalvik bytecode and IPC exposure.

### Steps to Reproduce:
1. From the navigation bar, click **"Privacy X-Ray"** (`/xray`).
2. Review the X-Ray summary:
   - Total Permissions Analyzed: **31**.
   - API References Discovered: **9 permissions with confirmed bytecode callsites**.
   - Permissions with No Direct Callsite: **22 declared permissions without direct framework references**.
3. Click on **`SYSTEM_ALERT_WINDOW`** (Display over other apps):
   - Expand the accordion to view exact bytecode callsites:
     - Class: `android/provider/Settings`
     - Method: `canDrawOverlays`
     - Descriptor: `()Z`
4. From the navigation bar, click **"Attack Surface"** (`/attack-surface`):
   - Total Components: **60**.
   - Exported (Accessible to other apps): **8**.
   - Unguarded Exported: **4 components without permission checks**.
   - Filter by **"Unguarded Only"** to pinpoint vulnerable components and review developer remediation advice.

---

## Scenario 3: Privacy Update Radar & Cryptographic Privacy Passport

**Goal:** Demonstrate differential version auditing and tamper-proof cryptographic report verification.

### Steps to Reproduce:
1. From the navigation bar, click **"Update Radar"** (`/radar`).
2. Upload two APK versions:
   - Old Version: `/tmp/aptoide_v10_0.apk`
   - New Version: `/tmp/aptoide_v10_1.apk`
3. Click **"Run Differential Audit"**.
4. Review the differential radar report:
   - Package Diff Verified: `cm.aptoide.pt`.
   - Score Delta: Identifies changes between versions.
   - Permissions Diff: Retained, added, and removed permissions.
   - Trackers Diff: New tracking frameworks introduced in the update.
5. From the navigation bar, click **"Privacy Passport"** (`/passport`):
   - View the official cryptographic certificate.
   - Observe the **Ed25519 digital signature**, public key fingerprint, and canonical SHA-256 digest.
   - Click **"Verify Certificate Authenticity"** to see live cryptographic validation pass.
   - Click **"Simulate Report Tampering"** to observe immediate verification failure upon payload modification.
