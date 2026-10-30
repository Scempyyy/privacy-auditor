#!/usr/bin/env bash
# ==============================================================================
# Android Privacy Auditor — Test Suite for Backup Exclusion Hardening
# Verifies that all real .env variants, keys, credentials, and APK binaries
# are excluded, while .env.example templates and code files are strictly preserved.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== Setting up Backup Exclusion Test Fixtures ==="

TEST_DIR="$(mktemp -d /tmp/backup-exclusion-test.XXXXXX)"
trap 'rm -rf "${TEST_DIR}"' EXIT

MOCK_ROOT="${TEST_DIR}/mock-android-privacy-auditor"
MOCK_BACKUPS="${TEST_DIR}/backups"
mkdir -p "${MOCK_ROOT}/web" "${MOCK_ROOT}/analyzer/app" "${MOCK_BACKUPS}"

# 1. Create real .env variants (MUST BE EXCLUDED)
echo "SECRET_1" > "${MOCK_ROOT}/.env"
echo "SECRET_2" > "${MOCK_ROOT}/.env.local"
echo "SECRET_3" > "${MOCK_ROOT}/.env.production"
echo "SECRET_4" > "${MOCK_ROOT}/.env.production.local"
echo "SECRET_5" > "${MOCK_ROOT}/.env.development"
echo "SECRET_6" > "${MOCK_ROOT}/.env.development.local"
echo "SECRET_7" > "${MOCK_ROOT}/.env.test"
echo "SECRET_8" > "${MOCK_ROOT}/.env.test.local"
echo "SECRET_9" > "${MOCK_ROOT}/.env.staging"
echo "SECRET_10" > "${MOCK_ROOT}/.env.custom_api_secret"
echo "SECRET_11" > "${MOCK_ROOT}/web/.env.local"
echo "SECRET_12" > "${MOCK_ROOT}/web/.env.production"

# 2. Create credentials and private keys (MUST BE EXCLUDED)
echo "DUMMY_KEY" > "${MOCK_ROOT}/server.key"
echo "DUMMY_PEM" > "${MOCK_ROOT}/cert.pem"
echo "DUMMY_ID_RSA" > "${MOCK_ROOT}/id_rsa"
echo "DUMMY_ID_ED25519" > "${MOCK_ROOT}/id_ed25519"
echo "DUMMY_KEYSTORE" > "${MOCK_ROOT}/release.keystore"
echo "DUMMY_JKS" > "${MOCK_ROOT}/app.jks"
echo '{"private_key": "dummy"}' > "${MOCK_ROOT}/credentials.json"
echo '{"private_key": "dummy"}' > "${MOCK_ROOT}/service_account.json"

# 3. Create APK and binary fixtures (MUST BE EXCLUDED)
echo "DUMMY_APK" > "${MOCK_ROOT}/sample.apk"
echo "DUMMY_AAB" > "${MOCK_ROOT}/bundle.aab"
echo "DUMMY_XAPK" > "${MOCK_ROOT}/app.xapk"
echo "DUMMY_APKS" > "${MOCK_ROOT}/app.apks"

# 4. Create allowed templates and source code (MUST BE PRESERVED)
echo "# Public env template" > "${MOCK_ROOT}/.env.example"
echo "# Web public template" > "${MOCK_ROOT}/web/.env.example"
echo '{"name": "web"}' > "${MOCK_ROOT}/web/package.json"
echo "print('hello')" > "${MOCK_ROOT}/analyzer/app/main.py"
echo "# Readme" > "${MOCK_ROOT}/README.md"

# Copy backup script into mock repo
mkdir -p "${MOCK_ROOT}/scripts"
cp "${REPO_ROOT}/scripts/backup.sh" "${MOCK_ROOT}/scripts/backup.sh"
chmod +x "${MOCK_ROOT}/scripts/backup.sh"

echo "=== Running Backup against Test Fixtures ==="
# Execute backup script with HOME pointing to TEST_DIR
HOME="${TEST_DIR}" "${MOCK_ROOT}/scripts/backup.sh" test-exclusion unit-01

BACKUP_ARCHIVE=$(find "${TEST_DIR}/android-privacy-auditor-backups" -name "*.tar.gz" | head -n 1)
SHA_FILE="${BACKUP_ARCHIVE}.sha256"
MANIFEST_FILE="${BACKUP_ARCHIVE}.manifest.txt"

echo "=== Validating Backup Integrity ==="
if [ ! -f "${BACKUP_ARCHIVE}" ]; then
    echo "FAILED: Backup archive not found!" >&2
    exit 1
fi

(cd "$(dirname "${BACKUP_ARCHIVE}")" && sha256sum -c "$(basename "${SHA_FILE}")")

if [ ! -f "${MANIFEST_FILE}" ]; then
    echo "FAILED: Manifest file not found!" >&2
    exit 1
fi

echo "=== Inspecting Archive Contents ==="
ARCHIVE_CONTENTS=$(tar -ztf "${BACKUP_ARCHIVE}")

# Verification Function
assert_excluded() {
    local pattern="$1"
    if echo "${ARCHIVE_CONTENTS}" | grep -q "${pattern}"; then
        echo "SECURITY VIOLATION: '${pattern}' was NOT excluded from the backup archive!" >&2
        exit 1
    fi
}

assert_included() {
    local pattern="$1"
    if ! echo "${ARCHIVE_CONTENTS}" | grep -q "${pattern}"; then
        echo "INTEGRITY ERROR: Required file '${pattern}' is missing from the backup archive!" >&2
        exit 1
    fi
}

echo "Testing exclusions of real .env files..."
assert_excluded "mock-android-privacy-auditor/\.env$"
assert_excluded "mock-android-privacy-auditor/\.env\.local$"
assert_excluded "mock-android-privacy-auditor/\.env\.production$"
assert_excluded "mock-android-privacy-auditor/\.env\.production\.local$"
assert_excluded "mock-android-privacy-auditor/\.env\.development$"
assert_excluded "mock-android-privacy-auditor/\.env\.development\.local$"
assert_excluded "mock-android-privacy-auditor/\.env\.test$"
assert_excluded "mock-android-privacy-auditor/\.env\.test\.local$"
assert_excluded "mock-android-privacy-auditor/\.env\.staging$"
assert_excluded "mock-android-privacy-auditor/\.env\.custom_api_secret$"
assert_excluded "mock-android-privacy-auditor/web/\.env\.local$"
assert_excluded "mock-android-privacy-auditor/web/\.env\.production$"

echo "Testing exclusions of credentials and private keys..."
assert_excluded "server\.key"
assert_excluded "cert\.pem"
assert_excluded "id_rsa"
assert_excluded "id_ed25519"
assert_excluded "release\.keystore"
assert_excluded "app\.jks"
assert_excluded "credentials\.json"
assert_excluded "service_account\.json"

echo "Testing exclusions of APK and AAB binaries..."
assert_excluded "sample\.apk"
assert_excluded "bundle\.aab"
assert_excluded "app\.xapk"
assert_excluded "app\.apks"

echo "Testing preservation of non-secret templates and source code..."
assert_included "mock-android-privacy-auditor/\.env\.example"
assert_included "mock-android-privacy-auditor/web/\.env\.example"
assert_included "mock-android-privacy-auditor/web/package\.json"
assert_included "mock-android-privacy-auditor/analyzer/app/main\.py"
assert_included "mock-android-privacy-auditor/README\.md"

echo "=================================================="
echo "Backup Exclusion Verification PASSED (All 24 test assertions verified)"
echo "=================================================="
