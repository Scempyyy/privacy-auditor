<div align="center">

# Android Privacy Auditor
### Understand what an Android app asks for—and why.

A local-first static analysis tool for APK privacy and security signals.

</div>

---

## Overview
Android Privacy Auditor examines APK metadata and compiled structure without installing or executing the app. It identifies declared permissions, known tracker/ad SDK signatures, and selected security-hygiene indicators, then produces an explainable privacy score.

> A score is an analytical signal—not proof that an app is malicious or safe.

## Key capabilities
- Static APK ingestion and manifest inspection
- Category-aware permission classification
- Tracker and advertising SDK signature matching
- Deterministic, itemized 0–100 scoring
- Permission-remediation guidance
- Local analysis with no cloud telemetry in the analyzer workflow

## Architecture
- **Analyzer:** Python · FastAPI
- **Companion interface:** Next.js · TypeScript · Tailwind CSS
- **Android direction:** Kotlin · Jetpack Compose

## Local development

### Analyzer
```bash
cd analyzer
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. pytest -v
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Web interface
```bash
cd web
npm install
npm run build
npm run dev
```

Then open `http://localhost:3000`.

## Privacy & safety notes
- APKs are analyzed statically; they are not run or installed.
- Findings can be incomplete or produce false positives.
- The score is transparent and heuristic-based; review the underlying findings.

## Documentation
See `docs/` for the specification, scoring model, architecture, and project progress.
