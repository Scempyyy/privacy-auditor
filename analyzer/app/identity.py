"""APK Publisher Identity & Supply Chain Inspector.

Extracts signing certificate metadata, signature scheme versions (v1/v2/v3),
native library (.so) architectures, DEX namespace inventories, and asset distributions.
Does not label unknown signers malicious; presents factual cryptographic provenance.
"""
import hashlib
import zipfile
from pathlib import Path
from typing import Any
from androguard.core.apk import APK
from app.models import PublisherIdentityReport, SigningCertificateInfo, NativeLibraryInfo


def inspect_publisher_identity(apk_path: Path, apk: APK | None = None) -> PublisherIdentityReport:
    """Extract cryptographic signing metadata and supply-chain assets from an APK."""
    if apk is None:
        apk = APK(str(apk_path))

    is_signed = apk.is_signed()
    is_v1 = apk.is_signed_v1()
    is_v2 = apk.is_signed_v2()
    is_v3 = apk.is_signed_v3()

    certs = apk.get_certificates()
    cert_infos: list[SigningCertificateInfo] = []

    for cert in certs:
        # cert is an asn1crypto.x509.Certificate
        issuer_str = str(cert.issuer.human_friendly) if hasattr(cert.issuer, "human_friendly") else str(cert.issuer)
        subject_str = str(cert.subject.human_friendly) if hasattr(cert.subject, "human_friendly") else str(cert.subject)
        
        # Validity dates
        valid_from = None
        valid_until = None
        try:
            valid_from = cert.not_valid_before.isoformat() if hasattr(cert, "not_valid_before") else None
            valid_until = cert.not_valid_after.isoformat() if hasattr(cert, "not_valid_after") else None
        except Exception:
            pass

        sha256_fp = cert.sha256.hex() if hasattr(cert, "sha256") else ""
        sha1_fp = cert.sha1.hex() if hasattr(cert, "sha1") else ""
        serial = str(cert.serial_number) if hasattr(cert, "serial_number") else ""

        cert_infos.append(
            SigningCertificateInfo(
                subject=subject_str,
                issuer=issuer_str,
                serial_number=serial,
                sha256_fingerprint=sha256_fp,
                sha1_fingerprint=sha1_fp,
                valid_from=valid_from,
                valid_until=valid_until,
            )
        )

    # Inspect zip contents for supply-chain assets
    native_libs: list[NativeLibraryInfo] = []
    dex_files: list[str] = []
    total_files = 0
    total_uncompressed_bytes = 0

    with zipfile.ZipFile(apk_path) as z:
        for entry in z.infolist():
            total_files += 1
            total_uncompressed_bytes += entry.file_size
            name = entry.filename

            if name.endswith(".dex"):
                dex_files.append(name)
            elif name.startswith("lib/") and name.endswith(".so"):
                parts = name.split("/")
                abi = parts[1] if len(parts) >= 3 else "unknown"
                lib_name = parts[-1]
                native_libs.append(
                    NativeLibraryInfo(
                        name=lib_name,
                        abi=abi,
                        path=name,
                        size_bytes=entry.file_size,
                    )
                )

    # Summary
    abis = sorted(list({lib.abi for lib in native_libs}))
    signer_summary = f"{len(cert_infos)} certificate(s) found. Schemes: "
    schemes = []
    if is_v1:
        schemes.append("v1 (JAR)")
    if is_v2:
        schemes.append("v2 (APK Signature Scheme v2)")
    if is_v3:
        schemes.append("v3 (APK Signature Scheme v3)")
    signer_summary += ", ".join(schemes) if schemes else "Unsigned or unrecognized scheme"

    return PublisherIdentityReport(
        is_signed=is_signed,
        v1_signing_enabled=is_v1,
        v2_signing_enabled=is_v2,
        v3_signing_enabled=is_v3,
        certificates=cert_infos,
        native_libraries=native_libs,
        dex_files=sorted(dex_files),
        supported_abis=abis,
        total_files=total_files,
        total_uncompressed_bytes=total_uncompressed_bytes,
        summary=signer_summary,
        limitations=[
            "A valid signature proves integrity and certificate ownership, not publisher trustworthiness.",
            "Certificates self-signed by developers are standard in the Android ecosystem and do not indicate malware.",
        ],
    )
