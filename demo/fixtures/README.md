# Backup Exclusion Test Fixtures & Rules

This directory documents the test fixtures and exclusion rules verified by [`scripts/test_backup_exclusions.sh`](file:///home/admin/android-privacy-auditor/scripts/test_backup_exclusions.sh).

## Exclusion Rules

The backup system strictly excludes the following categories:

1. **Environment Variables & Secrets**:
   - Every real `.env*` variant (`.env`, `.env.local`, `.env.production`, `.env.production.local`, `.env.development`, `.env.development.local`, `.env.test`, `.env.test.local`, `.env.staging`, `.env.*.local`, custom `.env.*`).
   - Exception: Only non-secret template files matching `*.example` (specifically `.env.example`) are preserved.

2. **Credentials & Cryptographic Keys**:
   - `*.pem`, `*.key`, `*.keystore`, `*.jks`, `*.p12`, `*.pfx`, `*.pkcs12`.
   - `id_rsa*`, `id_ed25519*`, `id_ecdsa*`, `id_dsa*`.
   - `*credentials*.json`, `*service_account*.json`, `*.secret`.

3. **Android Binaries**:
   - `*.apk`, `*.aab`, `*.xapk`, `*.apks`.

4. **Build Artifacts & Virtual Environments**:
   - `.git/`, `.venv/`, `venv/`, `node_modules/`, `.next/`, `out/`, `__pycache__/`, `*.pyc`, `*.pyo`, `.pytest_cache/`.

Run the automated verification suite anytime with:
```bash
./scripts/test_backup_exclusions.sh
```
