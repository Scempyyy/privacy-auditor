# Android Privacy Auditor

An open-source, local-first static analysis tool for Android application packages (`.apk` files). Android Privacy Auditor inspects declared permissions, detects embedded third-party tracking/advertising SDKs, assesses security hygiene flags, and computes an explainable, deterministic 0–100 privacy score.

---

## Key Features

- **Purely Static APK Ingestion**: Parses application metadata, `AndroidManifest.xml`, and DEX class hierarchies without running or installing the APK.
- **Category-Aware Permission Auditing**: Classifies requested Android permissions against baseline app category expectations (Expected, Review, Unusual) with deduplication.
- **Tracker & Ad SDK Detection**: Scans compiled bytecode against a curated database of advertising, profiling, identification, and analytics signatures.
- **Deterministic 0–100 Scoring Model**: Fully transparent mathematical scoring heuristic; every deduction is itemized with an explicit explanation. Zero LLM hallucinations in the scoring loop.
- **Remediation Guides**: Provides actionable step-by-step instructions for users to revoke invasive permissions in Android settings.
- **100% Offline & Private**: Zero cloud telemetry, no external exfiltration, and runs entirely on `localhost`.

---

## Project Structure

```
android-privacy-auditor/
├── web/                         # Next.js frontend (App Router, TypeScript, Tailwind CSS)
│   ├── app/                     # Page routes & layout
│   ├── package.json             # Frontend dependencies
│   └── tsconfig.json            # Strict TypeScript configuration
├── analyzer/                    # FastAPI backend service
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py              # FastAPI app & endpoints (e.g. GET /health)
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_health.py       # Automated backend test suite
│   ├── requirements.txt         # Pinned Python dependencies
│   └── .python-version          # Python version specification (3.14)
├── data/                        # Version-controlled knowledge base
│   ├── library/                 # Pre-scanned audit reports (JSON fixtures)
│   ├── permissions.json         # Android permissions catalog & risk levels
│   ├── categories.json          # App categories & permission expectations
│   ├── trackers.json            # Tracker signatures & functional categories
│   └── revoke_steps.json        # Android permission revocation guides
├── docs/                        # Architectural & scoring documentation
│   ├── SPEC.md                  # Functional MVP specification
│   ├── SCORING.md               # Deterministic scoring mathematical model
│   ├── ARCHITECTURE.md          # Architecture, data flow & security boundaries
│   └── PROGRESS.md              # Milestone tracking & progress checklist
├── scripts/                     # Local developer & dataset utility scripts
├── demo/                        # Synthetic APK fixtures & demo assets
├── AGENTS.md                    # Developer and AI agent guidelines
├── README.md                    # Project documentation
├── .gitignore                   # Comprehensive Git ignore rules
└── .env.example                 # Sanitized environment variable template
```

---

## Getting Started (Arch Linux / Linux)

### Prerequisites

- **Python**: 3.11+ (Tested on Python 3.14.8)
- **Node.js**: 20+ (Tested on Node.js v26.10.0, npm 11.19.1)
- **Git**: 2.40+ (Tested on Git 2.56.0)

---

### Backend Service (`analyzer/`)

1. **Navigate to the analyzer directory**:
   ```bash
   cd analyzer
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the automated test suite**:
   ```bash
   PYTHONPATH=. pytest -v
   ```

5. **Start the FastAPI development server**:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

6. **Verify health endpoint**:
   ```bash
   curl http://127.0.0.1:8000/health
   # Returns: {"status":"ok"}
   ```

---

### Frontend Application (`web/`)

1. **Navigate to the web directory**:
   ```bash
   cd web
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the production build verification**:
   ```bash
   npm run build
   ```

4. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Privacy & Security Guarantees

1. **No Cloud Dependencies**: All analysis runs completely on your local workstation.
2. **Never Execute APKs**: Uploaded APK packages are never executed or installed.
3. **No External Telemetry**: Next.js telemetry is disabled, and the backend has zero external outbound connections.
4. **Transparent Deductions**: No opaque artificial intelligence or black-box algorithms determine privacy scores.

---

## Contributing & Agent Guidelines

All human developers and AI assistants must review [AGENTS.md](file:///home/admin/android-privacy-auditor/AGENTS.md) and [docs/ARCHITECTURE.md](file:///home/admin/android-privacy-auditor/docs/ARCHITECTURE.md) before modifying files.
