#!/usr/bin/env python3
"""Initializes persistent Ed25519 signing key for Privacy Passport.
Key is stored outside the repository with restricted filesystem permissions (0600).
Refuses to overwrite an existing private key.
Prints public-key fingerprint only; never prints the private key.
"""
import os
import sys
import stat
import hashlib
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

KEY_DIR = Path(os.environ.get("PASSPORT_KEY_DIR", Path.home() / ".android-privacy-auditor"))
PRIVATE_KEY_PATH = KEY_DIR / "passport_ed25519.pem"
PUBLIC_KEY_PATH = KEY_DIR / "passport_ed25519.pub"


def init_keys() -> None:
    KEY_DIR.mkdir(parents=True, exist_ok=True)
    # Set directory permission to 0700
    KEY_DIR.chmod(0o700)

    if PRIVATE_KEY_PATH.exists():
        print(f"[INFO] Private key already exists at: {PRIVATE_KEY_PATH}")
        # Read existing public key and print fingerprint
        with open(PUBLIC_KEY_PATH, "rb") as f:
            pub_bytes = f.read()
        fingerprint = hashlib.sha256(pub_bytes).hexdigest()
        print(f"[INFO] Existing Public Key SHA-256 Fingerprint: {fingerprint}")
        return

    print(f"[INFO] Generating fresh Ed25519 keypair in {KEY_DIR}...")
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    priv_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    pub_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    # Write private key with strict 0600 permissions
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    mode = stat.S_IRUSR | stat.S_IWUSR  # 0600
    fd = os.open(str(PRIVATE_KEY_PATH), flags, mode)
    with os.fdopen(fd, "wb") as f:
        f.write(priv_pem)

    # Write public key (0644)
    with open(PUBLIC_KEY_PATH, "wb") as f:
        f.write(pub_pem)

    fingerprint = hashlib.sha256(pub_pem).hexdigest()
    print("==================================================")
    print("Privacy Passport Signing Key Initialized")
    print("==================================================")
    print(f"Key Directory:        {KEY_DIR}")
    print(f"Private Key:          {PRIVATE_KEY_PATH} (mode: 0600)")
    print(f"Public Key:           {PUBLIC_KEY_PATH}")
    print(f"Public Key Fingerprint: {fingerprint}")
    print("Security: Private key never logged, committed, or exposed.")
    print("==================================================")


if __name__ == "__main__":
    init_keys()
