"""Privacy Passport: Cryptographically verifiable audit report engine.

Generates canonical JSON serialization, SHA-256 digest, Ed25519 digital signatures,
and QR verification references.
"""
import os
import json
import base64
import hashlib
import io
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import qrcode
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature

from app.models import (
    CanonicalPassportPayload,
    PrivacyPassport,
    PassportVerifyResponse,
)

PASSPORT_SCHEMA_VERSION = "1.0.0"
ANALYZER_VERSION = "2.0.0"
METHODOLOGY_VERSION = "2026.10-R3"

KEY_DIR = Path(os.environ.get("PASSPORT_KEY_DIR", Path.home() / ".android-privacy-auditor"))
PRIVATE_KEY_PATH = KEY_DIR / "passport_ed25519.pem"
PUBLIC_KEY_PATH = KEY_DIR / "passport_ed25519.pub"


def canonicalize_json(data: dict[str, Any] | list[Any]) -> bytes:
    """Serializes data into canonical deterministic JSON format.
    UTF-8 encoded, sorted keys, no whitespace between separators.
    """
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def compute_payload_hash(payload: CanonicalPassportPayload) -> str:
    """Computes SHA-256 digest of canonicalized passport payload."""
    data_dict = payload.model_dump(mode="json")
    canonical_bytes = canonicalize_json(data_dict)
    return hashlib.sha256(canonical_bytes).hexdigest()


def load_signing_keys() -> tuple[ed25519.Ed25519PrivateKey | None, ed25519.Ed25519PublicKey | None, str | None]:
    """Loads private and public keys if available, returning (priv, pub, pub_fingerprint)."""
    if not PRIVATE_KEY_PATH.exists() or not PUBLIC_KEY_PATH.exists():
        return None, None, None
    try:
        with open(PRIVATE_KEY_PATH, "rb") as f:
            priv = serialization.load_pem_private_key(f.read(), password=None)
        with open(PUBLIC_KEY_PATH, "rb") as f:
            pub_bytes = f.read()
            pub = serialization.load_pem_public_key(pub_bytes)
        fingerprint = hashlib.sha256(pub_bytes).hexdigest()
        return priv, pub, fingerprint
    except Exception:
        return None, None, None


def generate_qr_code_base64(data: str) -> str:
    """Renders QR code as base64 PNG data URL."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=6,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"


def create_passport(
    report_dict: dict[str, Any],
    dataset_fingerprints: dict[str, str],
    commit_id: str | None = None,
) -> PrivacyPassport:
    """Creates a canonical PrivacyPassport from an analysis report dictionary."""
    passport_id = f"APA-{uuid.uuid4().hex[:12].upper()}"
    now_utc = datetime.now(timezone.utc).isoformat()

    # Extract xray summary counts if available
    xray_dict = report_dict.get("privacy_xray") or {}
    xray_summary = {
        "total_examined": xray_dict.get("total_permissions_examined", 0),
        "with_references": xray_dict.get("permissions_with_references", 0),
        "no_reference_observed": xray_dict.get("permissions_no_reference_observed", 0),
        "not_assessed": xray_dict.get("permissions_not_assessed", 0),
    }

    payload = CanonicalPassportPayload(
        passport_id=passport_id,
        issued_at_utc=now_utc,
        apk_sha256=report_dict.get("apk_sha256") or report_dict.get("scan_id", ""),
        package_name=report_dict["package_name"],
        app_name=report_dict.get("app_name"),
        version_name=report_dict.get("version_name"),
        version_code=report_dict.get("version_code"),
        min_sdk=report_dict.get("min_sdk"),
        target_sdk=report_dict.get("target_sdk"),
        compile_sdk=report_dict.get("compile_sdk"),
        category=report_dict["category"],
        score=report_dict["score"],
        grade=report_dict["grade"],
        deductions=report_dict["deductions"],
        permissions=report_dict["permissions"],
        trackers=report_dict["trackers"],
        security_findings=report_dict["security_findings"],
        xray_summary=xray_summary,
        analyzer_version=ANALYZER_VERSION,
        commit_identifier=commit_id or "1965dbd",
        methodology_version=METHODOLOGY_VERSION,
        dataset_fingerprints=dataset_fingerprints,
        limitations=report_dict.get("limitations", []),
    )

    payload_hash = compute_payload_hash(payload)

    # Attempt Ed25519 digital signature
    priv, pub, fingerprint = load_signing_keys()
    signature_hex: str | None = None
    is_signed = False

    if priv is not None:
        try:
            raw_sig = priv.sign(payload_hash.encode("utf-8"))
            signature_hex = raw_sig.hex()
            is_signed = True
        except Exception:
            signature_hex = None
            is_signed = False

    # Build compact QR payload: passport_id, apk_sha256, score, payload_hash
    qr_data = f"APA:ID={passport_id};SCORE={payload.score};SHA256={payload.apk_sha256[:16]};HASH={payload_hash[:16]}"
    qr_image = generate_qr_code_base64(qr_data)

    return PrivacyPassport(
        schema_version=PASSPORT_SCHEMA_VERSION,
        passport_id=passport_id,
        issued_at_utc=now_utc,
        canonical_payload_sha256=payload_hash,
        signature=signature_hex,
        public_key_fingerprint=fingerprint,
        is_signed=is_signed,
        qr_integrity_data=qr_data,
        qr_png_base64=qr_image,
        payload=payload,
    )


def verify_passport(passport: PrivacyPassport) -> PassportVerifyResponse:
    """Verifies passport canonical hash integrity and Ed25519 signature."""
    # 1. Verify canonical hash
    recomputed_hash = compute_payload_hash(passport.payload)
    hash_match = (recomputed_hash == passport.canonical_payload_sha256)

    if not hash_match:
        return PassportVerifyResponse(
            is_valid=False,
            payload_hash_match=False,
            signature_valid=False,
            trusted_signer=False,
            message="Tampering detected: Canonical payload SHA-256 does not match recorded digest.",
            fingerprint=passport.public_key_fingerprint,
        )

    # 2. Check if signed
    if not passport.is_signed or not passport.signature:
        return PassportVerifyResponse(
            is_valid=True,
            payload_hash_match=True,
            signature_valid=None,
            trusted_signer=False,
            message="Canonical payload integrity verified. Passport is unsigned (hash-only audit record).",
            fingerprint=None,
        )

    # 3. Verify signature with local trusted key
    _, trusted_pub, trusted_fingerprint = load_signing_keys()
    
    if trusted_pub is None:
        return PassportVerifyResponse(
            is_valid=True,
            payload_hash_match=True,
            signature_valid=None,
            trusted_signer=False,
            message="Canonical payload hash matches, but local verifier has no configured public key to verify signature.",
            fingerprint=passport.public_key_fingerprint,
        )

    # Compare fingerprint
    if passport.public_key_fingerprint != trusted_fingerprint:
        return PassportVerifyResponse(
            is_valid=False,
            payload_hash_match=True,
            signature_valid=False,
            trusted_signer=False,
            message=f"Untrusted signer: Key fingerprint '{passport.public_key_fingerprint}' does not match local trusted auditor fingerprint '{trusted_fingerprint}'.",
            fingerprint=passport.public_key_fingerprint,
        )

    try:
        sig_bytes = bytes.fromhex(passport.signature)
        trusted_pub.verify(sig_bytes, passport.canonical_payload_sha256.encode("utf-8"))
        return PassportVerifyResponse(
            is_valid=True,
            payload_hash_match=True,
            signature_valid=True,
            trusted_signer=True,
            message="Verification successful: Payload hash and Ed25519 digital signature are valid and verified against trusted auditor authority.",
            fingerprint=trusted_fingerprint,
        )
    except (InvalidSignature, ValueError) as exc:
        return PassportVerifyResponse(
            is_valid=False,
            payload_hash_match=True,
            signature_valid=False,
            trusted_signer=True,
            message=f"Cryptographic signature invalid: Digital signature failed verification: {exc}",
            fingerprint=trusted_fingerprint,
        )
