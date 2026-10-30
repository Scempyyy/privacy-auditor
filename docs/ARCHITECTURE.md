# System Architecture: Android Privacy Auditor

## 1. High-Level Architecture Overview

**Android Privacy Auditor** is a local-first web application designed to statically analyze Android APK packages for privacy, permission hygiene, and third-party tracker exposure. The architecture emphasizes modular separation between the browser presentation layer, the Python static analysis engine, and the static JSON knowledge base.

```
+-------------------------------------------------------------------------+
|                              Web Browser                                |
|  - Modern Dark-Themed Cybersecurity UI (Next.js App Router / Tailwind)  |
|  - APK File Upload & Validation Dropzone                                |
|  - Deterministic Score Visualizations & Grade Badges                    |
|  - Permissions & Tracker Inspector                                     |
|  - Remediation & Revocation Guides                                      |
+------------------------------------+------------------------------------+
                                     |
                                     | HTTP REST (JSON / Multipart Upload)
                                     v
+------------------------------------+------------------------------------+
|                      Analyzer Backend (FastAPI)                          |
|  - Host: 127.0.0.1:8000 (Local Uvicorn Server)                          |
|  - Endpoints:                                                           |
|      * GET  /health              -> Service status                      |
|      * POST /api/v1/analyze      -> Parse APK & calculate privacy score |
|      * GET  /api/v1/library      -> Curated pre-scanned app reports     |
|      * GET  /api/v1/library/{id} -> Single pre-scanned report           |
+------------------------------------+------------------------------------+
                                     |
                  +------------------+------------------+
                  |                                     |
                  v                                     v
+---------------------------------+   +---------------------------------+
|      Static APK Engine          |   |     Static Knowledge Base       |
|  - ZIP / Manifest Parser        |   |  - data/permissions.json        |
|  - Bytecode Class Matcher (DEX) |   |  - data/categories.json         |
|  - Purely Static (No Execution) |   |  - data/trackers.json           |
|  - Ephemeral /tmp file storage  |   |  - data/revoke_steps.json       |
+---------------------------------+   |  - data/library/ (*.json)       |
                                      +---------------------------------+
```

---

## 2. Component Specifications

### 2.1 Frontend (`web/`)
- **Framework**: Next.js (App Router, React, TypeScript).
- **Styling**: Tailwind CSS with a dark cybersecurity-inspired aesthetic (slate/zinc palette, neon accents for score severity bands).
- **State Management**: React state and native fetch clients; decoupled completely from server-side Python runtime.
- **Role**:
  - Handles client-side APK drag-and-drop ingestion with progress and validation feedback.
  - Renders interactive report cards, score meters (0–100), tracker tags, and permission classification matrices.
  - Provides instant access to pre-scanned reports in the library.

### 2.2 Backend (`analyzer/`)
- **Framework**: FastAPI with asynchronous endpoints running on Uvicorn.
- **Language**: Python 3.14+ with strict type annotations and Pydantic schema validation.
- **Role**:
  - Validates incoming multipart APK payloads (magic byte verification, size constraints).
  - Drives static parsing routines.
  - Matches declared permissions against `data/permissions.json` and evaluates contextual category expectations via `data/categories.json`.
  - Scans DEX bytecode class trees against tracker signatures loaded from `data/trackers.json`.
  - Calculates the deterministic score according to `docs/SCORING.md`.
  - Serves curated pre-scanned reports from `data/library/`.

### 2.3 Knowledge Base (`data/`)
- Curated, version-controlled JSON files that provide the single source of truth for all security rules:
  - `permissions.json`: Canonical Android permission catalogue with risk severity levels (Critical, High, Moderate, Low) and description metadata.
  - `categories.json`: App categories (e.g. Social, Navigation, Finance) and their baseline permission expectations (Expected, Review, Unusual).
  - `trackers.json`: Tracker, advertising, and analytics signatures mapped to categories (Advertisement, Profiling, Analytics, Crashlytics) with documentation links.
  - `revoke_steps.json`: Device and OS-specific instructions for revoking permissions in Android settings.
  - `library/`: Pre-scanned audit reports stored as static JSON fixtures.

---

## 3. Communication Contract & Data Flow

1. **User Upload**: The user selects or drags a `.apk` file in the frontend UI.
2. **Analysis Request**: The Next.js frontend sends a `POST /api/v1/analyze` request with multipart form data to FastAPI (`http://127.0.0.1:8000`).
3. **Validation & Ingestion**:
   - The backend checks file size ($\le 100\text{ MB}$) and confirms the ZIP header magic bytes (`PK\x03\x04`).
   - The file is saved to an ephemeral temporary directory (`/tmp/android-privacy-auditor/uploads/...`).
4. **Static Parsing**:
   - `AndroidManifest.xml` is extracted and parsed.
   - Declared permissions, target SDK, and security flags (`usesCleartextTraffic`, `debuggable`) are read.
   - DEX classes are enumerated and matched against tracker signatures.
5. **Score Computation**:
   - Penalties are aggregated deterministically ($P$, $T$, $S$).
   - Deductions are listed with human-readable rationale.
6. **Cleanup**:
   - Ephemeral APK files are deleted immediately after parsing.
7. **Response Delivery**:
   - A structured JSON response containing metadata, findings, deductions, and remediation steps is returned to the frontend.

---

## 4. Security & Isolation Boundaries

- **Strictly Local**: Services bind exclusively to localhost (`127.0.0.1`).
- **No Remote Telemetry**: Neither frontend nor backend initiates external outbound network requests.
- **No Dynamic Execution**: APKs are parsed purely as static archive data and byte sequences; no Dalvik/ART virtual machine, ADB bridge, or emulator is ever invoked.
- **Ephemeral Storage**: Uploaded files do not persist beyond the active request lifecycle.
- **Explicit CORS**: The backend CORS middleware restricts accepted origins strictly to `http://localhost:3000` and `http://127.0.0.1:3000`.

## 5. Backend API implementation

`POST /api/v1/analyze` accepts multipart fields `file` (APK) and `category` (one of the category keys in `data/categories.json`). It returns a strict JSON report. Uploads are streamed to a private temporary directory, capped at 100 MiB, structurally checked as ZIP archives, parsed statically with Androguard, and removed on success or failure. Archives with unsafe paths, duplicate entries, symbolic links, excessive expansion, or suspicious compression ratios are rejected. No archive member is extracted to disk.

Errors use `{"detail":"..."}`. Invalid uploads return 400, unknown categories return 422, and unexpected parse failures return a generic 500 response while internal details are logged locally. CORS permits only the two local frontend origins listed above. The API does not retain scan reports.

Permission and category records include explanations and source links. `data/trackers.json` currently has no entries: tracker detections stay empty until independently verified signatures with attribution are curated. A signature finding, once configured, is evidence of embedded code and does not establish active tracking. Declared permissions likewise do not establish runtime use.
