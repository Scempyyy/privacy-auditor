# Privacy Passport: Verifiable Audit Certificates

## 1. Overview
Privacy Passport provides portable, cryptographically verifiable audit reports for completed APK scans. It guarantees audit integrity using canonical JSON serialization and Ed25519 digital signatures.

## 2. Canonical Serialization & Hashing
To ensure reproducible verification across independent systems:
- UTF-8 deterministic JSON serialization.
- Sorted keys, no extra whitespace (`separators=(',', ':')`).
- Digest: `SHA-256(canonical_passport_payload)`.
- The digest and signature are excluded from the hashed payload to prevent circular dependencies.

## 3. Ed25519 Cryptographic Signatures
- **Algorithm**: Ed25519 asymmetric digital signature scheme.
- **Private Key Storage**: Persisted in restricted external directory `~/.android-privacy-auditor/passport_ed25519.pem` with strict `0600` POSIX permissions.
- **Security Boundaries**: Private keys are **never** logged, committed, included in backup archives, or exposed to the frontend or API responses.
- **Verification**: `POST /api/v1/passport/verify` validates payload hash match and checks Ed25519 digital signatures against trusted auditor public keys.

## 4. QR Integrity Reference
A compact QR code encodes passport ID, privacy score, truncated APK hash, and payload digest reference for quick physical and visual verification.
