# Android Privacy Auditor — Hackathon Judge Presentation

**Project:** Android Privacy Auditor  
**Tagline:** Verifiable, Air-Gapped Android Privacy & Security Intelligence  
**Stack:** Next.js 16 (React, TypeScript, Tailwind CSS) + Python FastAPI + Androguard + Ed25519 Cryptography  
**Environment:** 100% Local Development & Execution (Arch Linux)

---

## 1. Executive Pitches

### The 30-Second Elevator Pitch
> *"Over 90% of popular mobile apps request permissions they never actually use in bytecode, bundle invasive third-party ad trackers, and expose unguarded background services to arbitrary apps on your device. Android Privacy Auditor is an open, local-first static analysis platform that transforms raw APKs into actionable privacy audits, bytecode evidence trails, verifiable cryptographic passports, and differential release comparisons—all computed 100% locally on your machine with zero cloud transmission."*

### The 2-Minute Technical Pitch
> *"Current mobile privacy auditing faces three core flaws: cloud scanners require you to upload proprietary or confidential binaries to remote servers, permission scanners naively treat manifest declarations as actual usage without Dalvik bytecode proof, and audit reports are static PDFs vulnerable to tampering.
>
> We solved all three:
> 1. **Air-Gapped & Local-First:** Our backend uses Androguard with multidex decompilation, streaming file handlers, and local Exodus signature matching. Our test suite includes a socket-monkeypatched unit test proving zero outbound network calls during analysis.
> 2. **Privacy X-Ray Bytecode Tracing:** Instead of guessing, we map Android permissions to underlying Dalvik VM method callsites (e.g. `getLastKnownLocation`, `checkOpNoThrow`, `getDefaultSensor`). We prove whether code references exist or if a permission is declared but unobserved.
> 3. **Privacy Update Radar:** APK updates often sneak in telemetry. Radar performs differential AST, manifest, and tracker comparison between two versions of an app, isolating added permissions, newly bundled SDKs, and net score changes.
> 4. **Privacy Passport (Ed25519 Cryptography):** We generate canonical RFC 8785 JSON digests and sign them with Ed25519 asymmetric cryptography. Anyone can independently verify the audit certificate using standard OpenSSL CLI—no trust in our servers required.
> 5. **Attack Surface Explorer & Nutrition Label:** We inspect IPC exposure (Activities, Services, Receivers, Providers) to identify unguarded components exposed to malicious apps on the device, and summarize findings in a consumer-friendly Privacy Nutrition Label with print/PDF export."*

---

## 2. Hackathon Judging Criteria Alignment

| Judging Criterion | Auditor Implementation | Evidence / Proof |
| :--- | :--- | :--- |
| **Technical Depth & Execution** | • Multidex Dex bytecode decompilation<br>• Permission-to-bytecode callsite mapping<br>• Asymmetric Ed25519 cryptographic signing<br>• Manifest component IPC analysis | • 28 Pytest tests passing (`analyzer/tests/test_backend.py`)<br>• End-to-end browser tests verifying real APK flows |
| **Innovation & Originality** | • Privacy X-Ray bridges manifest declarations and Dalvik callsites<br>• Privacy Update Radar provides git-diff style privacy auditing<br>• Cryptographic Privacy Passport with QR verification | • Live differential analyzer on real APK releases (`/radar`)<br>• Offline Ed25519 signature & SHA-256 verification |
| **User Experience & Design** | • Modern cyber-themed UI built with Next.js 16 & Tailwind<br>• Interactive bytecode callsite accordion<br>• Consumer-facing Privacy Nutrition Label<br>• Print-ready audit export | • Responsive layout on all viewports<br>• Verified by automated Playwright browser test suite |
| **Privacy & Security Integrity** | • Strict zero-network guarantee (air-gapped ready)<br>• Ephemeral file lifecycle with auto-purging<br>• Private keys secured with `0600` permissions and Git-excluded | • Socket monkeypatch unit test passes<br>• Private keys never exposed or stored in version control |
| **Completeness & Reliability** | • Not a Figma mockup: 100% working, full-stack application<br>• End-to-end verified with real 22MB APK | • Zero build errors (`npm run build` static generation)<br>• Full browser E2E test runs with zero mock data |

---

## 3. Five Judge Questions & Honest Answers

### Q1: *"How does this differ from Exodus Privacy or ClassyShark?"*
**Answer:**  
Exodus Privacy is a fantastic tracker catalog, and we integrate their curated 428 tracker database with full licensing attribution. However, Exodus stops at tracker signature matching. Android Privacy Auditor adds:
1. **Privacy X-Ray:** Bytecode evidence analysis proving whether declared dangerous permissions actually have corresponding Dalvik callsites.
2. **Privacy Update Radar:** Direct differential comparison between two versions of an APK to detect privacy regressions.
3. **Privacy Passport:** Cryptographic provenance and tamper-evident signing.
4. **Attack Surface Explorer:** Manifest IPC analysis detecting unguarded exported components.
5. **Local-First Execution:** Exodus runs as a hosted cloud service; our platform is completely local and air-gapped.

### Q2: *"Can you detect runtime telemetry that bypasses static signatures?"*
**Answer (Honest Limitation):**  
No. We are transparent about static analysis limitations:
- Static analysis inspects DEX bytecode and manifest declarations.
- Dynamic network traffic, runtime code generation (`DexClassLoader`), and server-side toggles cannot be observed without running the app in a sandboxed emulator.
- We explicitly state this limitation on every report and in our Methodology section.

### Q3: *"Does an observed DEX callsite prove that the app is actively spying on the user?"*
**Answer:**  
No, and we never make that claim. An observed callsite in DEX proves that the app or one of its bundled libraries contains bytecode capable of invoking that API (e.g. `getLastKnownLocation`). Whether that code executes at runtime depends on user behavior, consent prompts, and execution flow. Our UI labels this as *"API Reference Discovered"*, not *"Active Malicious Behavior"*.

### Q4: *"Why use Ed25519 cryptography for audit reports?"*
**Answer:**  
Audit reports are often shared between developers, compliance officers, and app store reviewers. A static PDF or screenshot is trivial to forge or alter. By generating a canonical JSON digest and signing it with an Ed25519 private key, anyone with the auditor's public key can mathematically verify that the audit report was generated by our engine and has not been altered by even a single byte.

### Q5: *"How do you handle apps that use code obfuscation (e.g., ProGuard or R8)?"*
**Answer:**  
Android platform API calls (like `android.location.LocationManager`) cannot be renamed by ProGuard/R8 because they are system framework classes. Therefore, our Privacy X-Ray callsites remain accurate even in obfuscated code. Tracker package names can be obfuscated, which is why we also match against known DEX string signatures and manifest declarations.

---

## 4. Key Metrics & Verification Evidence

- **Pytest Suite:** 28 passing unit and integration tests (0 failures).
- **Network Isolation:** 100% verified via automated socket monkeypatch test.
- **Frontend Build:** Next.js 16 with 13 statically prerendered routes (0 lint/build errors).
- **Real APK Tested:** Tested on real 22MB APK (`cm.aptoide.pt`, 31 Activities, 18 Services, 7 Receivers, 4 Providers).
- **Screenshots:** High-resolution screenshots captured across all 5 features in `docs/screenshots/`.
