# AGENTS.md — Developer and AI Agent Guidelines

> **IMPORTANT**: All agents, contributors, and automated tooling must read and strictly adhere to this document before creating or modifying any files in this repository.

---

## 1. Project Mission & MVP Scope

**Android Privacy Auditor** is a local, privacy-focused auditing tool for Android APK files. It provides users with transparency into what Android applications do behind the scenes by statically analyzing application packages to inspect declared permissions, identify third-party tracking libraries, evaluate security configurations, and compute a deterministic privacy score.

### MVP Scope
- Accept an Android APK (`base.apk`) via web interface or API.
- Statically parse APK metadata: package name, app label, version code/name, min/target/compile SDK.
- Extract declared Android permissions and classify them against application categories (e.g., Camera, Location, Storage, Telephony).
- Detect embedded third-party tracker SDKs and advertising libraries using static signature matching against known tracker signatures.
- Calculate a deterministic privacy score from 0 to 100 with explicit breakdown and transparent deductions.
- Provide actionable privacy remediation instructions (step-by-step revocation guidance for dangerous permissions).
- Display at least 10 pre-scanned application reports in a curated library.

### Explicit Non-Goals & Deferred Scope
- **No User Accounts / Authentication**: The application operates locally without user registration, login, or session tracking.
- **No Cloud Services / Telemetry**: Audits are performed entirely offline/on-premises.
- **No Dynamic Traffic Analysis**: No network interception or proxying.
- **No Runtime APK Execution**: APKs are never installed, emulated, or executed.
- **No PDF Export (MVP)**: Deferred to a subsequent release.
- **No Companion Android App**: Web-first platform.
- **No LLM-Based Runtime Scoring**: Privacy scoring must be completely deterministic and reproducible.

---

## 2. Architecture & Technology Stack

The project consists of two independent services communicating strictly via HTTP REST:

```
[ Frontend: Next.js + Tailwind CSS ]  <--- HTTP/JSON --->  [ Backend: FastAPI + Uvicorn ]
         (Port: 3000)                                              (Port: 8000)
                                                                        |
                                                               [ Static APK Engine ]
                                                                        |
                                                               [ Local JSON Knowledge Base ]
```

### Technology Stack
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS.
- **Backend**: Python (>=3.11, target 3.14), FastAPI, Uvicorn, Pytest.
- **APK Analysis Engine**: Static inspection (Androguard in later module). Strictly no dynamic execution.
- **Knowledge Base**: Curated JSON datasets in `data/` versioned in Git.

---

## 3. Folder Ownership & Boundaries

Strict separation of concerns must be maintained across repository folders:

| Folder | Ownership / Responsibility | Allowed Modifiers |
|---|---|---|
| `web/` | Next.js frontend application, UI components, client-side state. | Frontend tasks only. Never import Python code or read server filesystem directly. |
| `analyzer/` | FastAPI backend, APK parsing engine, scoring engine, unit/integration tests. | Backend tasks only. Never depend on Next.js or frontend assets. |
| `data/` | Static knowledge base (`permissions.json`, `categories.json`, `trackers.json`, `revoke_steps.json`, `library/`). | Curated data tasks. Must be valid JSON adhering to documented schemas. |
| `docs/` | Architectural specs, scoring specifications, progress logs, API contracts. | All documentation tasks. |
| `scripts/` | Local developer automation, dataset validation, pre-scan utilities. | Developer tooling only. |
| `demo/` | Sample APKs, synthetic test APK fixtures, demo assets. | Never commit real proprietary APKs; synthetic or F-Droid open-source samples only. |

Frontend and backend must remain completely independent:
- The frontend must never attempt direct filesystem access to backend data or APK files.
- The backend must never generate HTML or couple itself to Next.js internals.
- Both communicate exclusively through documented HTTP API contracts.

---

## 4. Coding Standards

### Python (Backend)
- Adhere to **PEP 8** style guidelines.
- Use explicit type annotations for all function signatures and Pydantic models.
- Avoid global mutable state.
- Keep endpoints thin: delegate logic to domain services and utility modules.
- Handle exceptions gracefully; return standard HTTP status codes and structured JSON errors:
  ```json
  {
    "detail": "Descriptive human-readable error message"
  }
  ```

### TypeScript / Next.js (Frontend)
- Adhere to strict TypeScript checks (`strict: true` in `tsconfig.json`).
- Avoid `any`; define explicit interfaces and types for API responses and component props.
- Keep components modular, accessible, and responsive.
- Use Tailwind CSS utility classes; avoid inline styles.
- Follow Next.js App Router conventions (`app/` directory, server vs. client components).

---

## 5. Testing Requirements

- **No Fabricated Tests**: Every test must physically execute against running code or test fixtures. Never claim test coverage or test passes without running `pytest` or `npm test`.
- **Backend Tests**:
  - Located in `analyzer/tests/`.
  - All endpoints must have automated pytest test cases using `httpx` / FastAPI `TestClient`.
  - Test suites must be runnable via `pytest` inside the virtual environment.
- **Frontend Tests & Build Verification**:
  - Every frontend change must pass type checking and `npm run build` without compilation or linting errors.

---

## 6. API Contract Conventions

- **RESTful Endpoints**: Use standard HTTP methods (`GET`, `POST`, `OPTIONS`).
- **Endpoint Versioning**: Core API routes must reside under `/api/v1/` (except `/health` which is root-level).
- **Payload Format**: All request and response bodies must be valid `application/json` (or `multipart/form-data` for APK file uploads).
- **Health Check**: `GET /health` must return `{"status": "ok"}`.
- **Deterministic Response Schema**: All analysis responses must provide a consistent JSON schema including:
  - App metadata (package name, version, SDKs).
  - Permission breakdown with category mapping and risk levels.
  - Detected trackers with categories and documentation links.
  - Deterministic score breakdown (permissions penalty, trackers penalty, hygiene penalty, final score, grade).
  - Remediation instructions for flagged permissions.

---

## 7. Security & Privacy Rules

- **Zero Remote Exfiltration**: Never send uploaded APKs, hashes, or audit results to external third parties.
- **No Dynamic Execution**: Never execute, install, or run APK binaries under any circumstance. Analysis is purely static parsing of `AndroidManifest.xml`, DEX bytecode, and asset manifests.
- **Upload Hygiene**:
  - Uploaded APKs must be stored in isolated, temporary directories ignored by Git.
  - File size limits must be strictly enforced (e.g., maximum 100 MB).
  - Temporary files must be cleaned up after analysis.
- **Secrets Management**:
  - Never commit `.env`, credentials, or private keys to version control.
  - Use `.env.example` with sanitized placeholders.
- **Git Safety**:
  - Work locally only.
  - Do NOT configure remotes to external repositories.
  - Do NOT push code to remote repositories without explicit instruction.

---

## 8. Deterministic Scoring & No LLM Runtime Scoring

- **Deterministic Scoring**: All privacy scores must be calculated via transparent, reproducible arithmetic rules documented in `docs/SCORING.md`.
- **No LLM in Critical Path**: LLMs must NEVER be used at runtime to compute scores, infer tracker presence, or generate arbitrary risk deductions. Every deduction must trace directly to a verified permission, tracker signature, or manifest flag.
- **Versioned Heuristic**: The scoring model is a heuristic versioned alongside the code. Discrepancies between the implementation and `docs/SCORING.md` are bugs.

---

## 9. Dependency Management Rules

- Backend dependencies must be pinned in `analyzer/requirements.txt`.
- Frontend dependencies must be managed via `npm` and committed with a clean `package-lock.json`.
- Do NOT install system packages via `sudo` or modify system-wide Python/Node installations without explicit user authorization.
- Do NOT introduce unvetted third-party frameworks or cloud SDKs.
