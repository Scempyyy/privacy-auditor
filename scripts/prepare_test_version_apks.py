#!/usr/bin/env python3
"""Prepares two real-origin APK version releases for Update Radar testing.
Source: /home/admin/Downloads/viruses-24hours.apk (cm.aptoide.pt v10.0.0).
Produces two valid, distinct version fixtures in /tmp:
- /tmp/aptoide_v10_0.apk (baseline release)
- /tmp/aptoide_v10_1.apk (patched release with simulated update metadata)
"""
import zipfile
import io
from pathlib import Path

SOURCE_APK = Path("/home/admin/Downloads/viruses-24hours.apk")
OUT_V1 = Path("/tmp/aptoide_v10_0.apk")
OUT_V2 = Path("/tmp/aptoide_v10_1.apk")

def main():
    if not SOURCE_APK.exists():
        raise FileNotFoundError(f"Source APK not found at {SOURCE_APK}")

    with zipfile.ZipFile(SOURCE_APK) as z:
        entries = {name: z.read(name) for name in z.namelist()}

    # Version 1: Original contents
    with zipfile.ZipFile(OUT_V1, "w") as z1:
        for k, v in entries.items():
            z1.writestr(k, v)

    # Version 2: Modified contents (adding a version manifest stamp)
    with zipfile.ZipFile(OUT_V2, "w") as z2:
        for k, v in entries.items():
            z2.writestr(k, v)
        z2.writestr("assets/release_v10_1_manifest.json", b'{"release": "10.0.1", "channel": "stable"}')

    print(f"Created {OUT_V1} ({OUT_V1.stat().st_size} bytes)")
    print(f"Created {OUT_V2} ({OUT_V2.stat().st_size} bytes)")

if __name__ == "__main__":
    main()
