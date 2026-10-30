#!/usr/bin/env bash
# ==============================================================================
# Android Privacy Auditor — Project Backup Script
# Usage: ./scripts/backup.sh <module-label> [prompt-label]
# Example: ./scripts/backup.sh module-00 prompt-01
# ==============================================================================

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <module-label> [prompt-label]"
    echo "Example: $0 module-00 prompt-01"
    exit 1
fi

MODULE="$1"
PROMPT="${2:-}"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"

# Resolve directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_NAME="$(basename "${REPO_ROOT}")"
REPO_PARENT="$(dirname "${REPO_ROOT}")"

BACKUP_DIR="${HOME}/android-privacy-auditor-backups"
mkdir -p "${BACKUP_DIR}"

# Sanitize labels to safe characters
SAFE_MODULE=$(printf "%s" "${MODULE}" | sed "s/[^a-zA-Z0-9_-]/_/g")
SAFE_PROMPT=$(printf "%s" "${PROMPT}" | sed "s/[^a-zA-Z0-9_-]/_/g")

if [ -n "${SAFE_PROMPT}" ]; then
    LABEL="${SAFE_MODULE}_${SAFE_PROMPT}"
else
    LABEL="${SAFE_MODULE}"
fi

if [[ "${LABEL}" =~ ^backup_ ]]; then
    ARCHIVE_BASENAME="${LABEL}_${TIMESTAMP}"
else
    ARCHIVE_BASENAME="backup_${LABEL}_${TIMESTAMP}"
fi

ARCHIVE_NAME="${ARCHIVE_BASENAME}.tar.gz"
ARCHIVE_PATH="${BACKUP_DIR}/${ARCHIVE_NAME}"
SHA256_PATH="${ARCHIVE_PATH}.sha256"
MANIFEST_PATH="${ARCHIVE_PATH}.manifest.txt"

# Never overwrite an existing backup
if [ -e "${ARCHIVE_PATH}" ]; then
    echo "Error: Backup archive already exists: ${ARCHIVE_PATH}" >&2
    exit 1
fi

echo "Creating backup archive: ${ARCHIVE_NAME}..."

# Create compressed TAR.GZ archive with strict exclusions
tar -czf "${ARCHIVE_PATH}" \
    -C "${REPO_PARENT}" \
    --exclude='.git' \
    --exclude='.venv' \
    --exclude='venv' \
    --exclude='env' \
    --exclude='ENV' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='out' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='*.pyo' \
    --exclude='.pytest_cache' \
    --exclude='.coverage' \
    --exclude='htmlcov' \
    --exclude='.mypy_cache' \
    --exclude='.ruff_cache' \
    --exclude='*.apk' \
    --exclude='*.aab' \
    --exclude='*.xapk' \
    --exclude='*.apks' \
    --exclude='.env' \
    --exclude='.env.local' \
    --exclude='.env.*.local' \
    --exclude='*.pem' \
    --exclude='*.key' \
    --exclude='*.keystore' \
    --exclude='*.jks' \
    --exclude='id_rsa*' \
    --exclude='id_ed25519*' \
    --exclude='uploads' \
    --exclude='tmp' \
    --exclude='temp' \
    --exclude='scratch' \
    --exclude='*.tsbuildinfo' \
    --exclude='.turbo' \
    "${REPO_NAME}"

# Generate SHA-256 checksum file
(cd "${BACKUP_DIR}" && sha256sum "${ARCHIVE_NAME}" > "${SHA256_PATH}")
CHECKSUM=$(cut -d' ' -f1 "${SHA256_PATH}")

# Inspect Git state
GIT_BRANCH="unknown"
GIT_COMMIT="None (initial commit pending)"
GIT_STATUS="No git repository detected"

if [ -d "${REPO_ROOT}/.git" ]; then
    GIT_BRANCH=$(git -C "${REPO_ROOT}" branch --show-current 2>/dev/null || echo "detached")
    if git -C "${REPO_ROOT}" rev-parse HEAD >/dev/null 2>&1; then
        GIT_COMMIT=$(git -C "${REPO_ROOT}" rev-parse HEAD)
    fi
    GIT_STATUS=$(git -C "${REPO_ROOT}" status --short)
fi

# Write manifest
cat <<EOF > "${MANIFEST_PATH}"
Android Privacy Auditor — Backup Manifest
==================================================
Timestamp (UTC):   $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Timestamp (Local): $(date +"%Y-%m-%d %H:%M:%S %Z")
Module:            ${MODULE}
Prompt:            ${PROMPT:-N/A}
Archive Name:      ${ARCHIVE_NAME}
Archive Path:      ${ARCHIVE_PATH}
SHA-256 Checksum:  ${CHECKSUM}
Archive Size:      $(du -h "${ARCHIVE_PATH}" | cut -f1) ($(stat -c%s "${ARCHIVE_PATH}") bytes)
Git Branch:        ${GIT_BRANCH}
Git Commit:        ${GIT_COMMIT}
Git Status:
${GIT_STATUS:-Clean (no changes)}
==================================================
EOF

# Output confirmation details
echo "=================================================="
echo "Android Privacy Auditor — Backup Complete"
echo "=================================================="
echo "Archive:   ${ARCHIVE_PATH}"
echo "SHA-256:   ${CHECKSUM}"
echo "Checksum:  ${SHA256_PATH}"
echo "Manifest:  ${MANIFEST_PATH}"
echo "Size:      $(du -h "${ARCHIVE_PATH}" | cut -f1) ($(stat -c%s "${ARCHIVE_PATH}") bytes)"
echo "=================================================="
