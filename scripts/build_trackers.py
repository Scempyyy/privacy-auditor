#!/usr/bin/env python3
"""Builds validated data/trackers.json from Exodus Privacy upstream dataset.
Primary Source: https://reports.exodus-privacy.eu.org/api/trackers
Repository: https://github.com/Exodus-Privacy/exodus

Licensing Distinction:
- Exodus Platform Source Code: GNU AGPL v3
- Exodus Database & API Dataset: Open Database License (ODbL) v1.0
- Individual Database Contents: Database Contents License (DBCL) v1.0
Attribution: Exodus Privacy (https://reports.exodus-privacy.eu.org)
"""
import json
import urllib.request
from pathlib import Path

VERIFIED_AT = "2026-10-30"
EXODUS_API = "https://reports.exodus-privacy.eu.org/api/trackers"

def map_category(categories: list[str]) -> str:
    """Map Exodus category list to scoring domain category."""
    cats_lower = [c.lower() for c in categories]
    # Priority: profiling/location/id -> advertising -> analytics -> crash_reporting
    if any(c in cats_lower for c in ["profiling", "identification", "location"]):
        return "profiling"
    if any(c in cats_lower for c in ["advertisement", "ad", "advertising"]):
        return "advertising"
    if any(c in cats_lower for c in ["analytics"]):
        return "analytics"
    if any(c in cats_lower for c in ["crash reporting", "crash_reporting", "crash"]):
        return "crash_reporting"
    return "analytics"

def main():
    print(f"Fetching Exodus tracker dataset from {EXODUS_API}...")
    req = urllib.request.Request(
        EXODUS_API,
        headers={"User-Agent": "AndroidPrivacyAuditor/1.0 (offline cache builder)"}
    )
    with urllib.request.urlopen(req) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    
    raw_trackers = payload.get("trackers", {})
    total_upstream_records = len(raw_trackers)
    output = {}

    for tid_str, raw in raw_trackers.items():
        name = raw.get("name", "").strip()
        code_sig = raw.get("code_signature", "").strip()
        if not name:
            continue
        # Skip records without a usable code signature (cannot be matched against DEX classes)
        if not code_sig:
            continue
            
        cats = raw.get("categories", [])
        mapped_cat = map_category(cats)
        
        output[f"exodus_{raw['id']}"] = {
            "id": raw["id"],
            "name": name,
            "category": mapped_cat,
            "raw_categories": cats,
            "signature": code_sig,
            "signature_type": "class_prefix",
            "network_signature": raw.get("network_signature", "").strip() or None,
            "website": raw.get("website", "").strip() or None,
            "description": raw.get("description", "").strip() or f"{name} third-party SDK.",
            "source": "Exodus Privacy",
            "attribution": "Data provided by Exodus Privacy (https://reports.exodus-privacy.eu.org), licensed under ODbL 1.0 / DBCL 1.0.",
            "license": "ODbL-1.0 / DBCL-1.0 (platform AGPL-3.0)",
            "verified_at": VERIFIED_AT,
        }

    dest = Path("data/trackers.json")
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, sort_keys=True)
        
    print(f"Successfully processed {total_upstream_records} upstream records.")
    print(f"Compiled {len(output)} records with usable code signatures into {dest}")

if __name__ == "__main__":
    main()
