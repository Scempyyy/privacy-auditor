"""Backend validation, deterministic scoring, and API tests."""
import asyncio
import io
import zipfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import analyzer
from app.main import app
from app.scoring import calculate_score

client = TestClient(app)


def make_zip(entries: dict[str, bytes] | None = None) -> bytes:
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w") as archive:
        for name, content in (entries or {"AndroidManifest.xml": b"synthetic"}).items():
            archive.writestr(name, content)
    return output.getvalue()


def test_health() -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_archive_acceptance_and_malformed_rejection(tmp_path: Path) -> None:
    valid = tmp_path / "synthetic.apk"
    valid.write_bytes(make_zip())
    analyzer.validate_archive(valid)
    invalid = tmp_path / "broken.apk"
    invalid.write_bytes(b"not a zip")
    with pytest.raises(analyzer.InvalidApk):
        analyzer.validate_archive(invalid)


def test_archive_rejects_path_traversal(tmp_path: Path) -> None:
    path = tmp_path / "unsafe.apk"
    path.write_bytes(make_zip({"AndroidManifest.xml": b"x", "../escape": b"x"}))
    with pytest.raises(analyzer.InvalidApk, match="unsafe path"):
        analyzer.validate_archive(path)


def test_permission_group_deduplication_and_determinism() -> None:
    permissions = [
        {"name": "fine", "risk": "High", "category_classification": "Review", "group": "LOCATION"},
        {"name": "coarse", "risk": "Moderate", "category_classification": "Review", "group": "LOCATION"},
    ]
    first = calculate_score(permissions, [], 33, False, False)
    assert first == calculate_score(permissions, [], 33, False, False)
    assert first[0] == 93  # 6 + 0.75


def test_category_changes_permission_penalty() -> None:
    permission = {"name": "camera", "risk": "High", "group": "CAMERA"}
    expected = {**permission, "category_classification": "Expected"}
    unusual = {**permission, "category_classification": "Unusual"}
    assert calculate_score([expected], [], 33, False, False)[0] == 99
    assert calculate_score([unusual], [], 33, False, False)[0] == 91


def test_tracker_signature_matching() -> None:
    signatures = {"vendor": {"signature_type": "class_prefix", "signature": "Lcom/vendor/ads/"}}
    assert analyzer.match_tracker_signatures(["Lcom/vendor/ads/Client;"], signatures) == [
        ("vendor", "Lcom/vendor/ads/Client;")
    ]
    assert analyzer.match_tracker_signatures(["Lorg/example/App;"], signatures) == []


def test_tracker_scoring_weights() -> None:
    trackers = [{"category": "advertising"}, {"category": "advertising"}, {"category": "analytics"}]
    score, _, deductions = calculate_score([], trackers, 33, False, False)
    assert score == 90
    assert sum(item["points"] for item in deductions) == 10


def test_scoring_caps_and_grade_boundaries() -> None:
    empty = calculate_score([], [], 33, False, False)
    assert empty[:2] == (100, "Good")
    p = [{"name": str(i), "risk": "Critical", "category_classification": "Unusual", "group": str(i)} for i in range(7)]
    assert calculate_score(p, [], 15, True, True)[:2] == (25, "Poor")
    assert calculate_score([], [], 23, False, False)[:2] == (96, "Good")


def test_each_grade_band_boundary() -> None:
    def permissions(count: int) -> list[dict[str, str]]:
        return [{"name": str(index), "risk": "Critical", "category_classification": "Review",
                 "group": str(index)} for index in range(count)]
    assert calculate_score(permissions(2), [], 33, False, False)[:2] == (80, "Good")
    assert calculate_score(permissions(3), [], 33, False, False)[:2] == (70, "Fair")
    assert calculate_score(permissions(5), [], 33, False, False)[:2] == (50, "Risky")
    assert calculate_score(permissions(7), [], 22, True, True)[:2] == (25, "Poor")


def test_upload_size_limit() -> None:
    async def exercise() -> None:
        upload = type("Upload", (), {})()
        upload.size = None
        upload.closed = False
        remaining = analyzer.MAX_UPLOAD_BYTES + 1
        async def read(_: int) -> bytes:
            nonlocal remaining
            if remaining == 0:
                return b""
            chunk = b"x" * min(remaining, 1024 * 1024)
            remaining -= len(chunk)
            return chunk
        async def close() -> None:
            upload.closed = True
        upload.read, upload.close = read, close
        with pytest.raises(analyzer.InvalidApk, match="100 MB"):
            await analyzer.analyze_upload(upload, "utility")
        assert upload.closed
    asyncio.run(exercise())


def test_api_rejects_invalid_file() -> None:
    response = client.post("/api/v1/analyze", files={"file": ("bad.apk", b"bad")}, data={"category": "utility"})
    assert response.status_code == 400
    assert "valid APK" in response.json()["detail"]


def test_api_category_validation_and_error_shape() -> None:
    response = client.post("/api/v1/analyze", files={"file": ("bad.apk", b"bad")}, data={"category": "made_up"})
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], str)


def test_duplicate_permissions_are_deduplicated() -> None:
    declarations = ["android.permission.INTERNET", "android.permission.INTERNET"]
    assert analyzer.unique_permissions(declarations) == ["android.permission.INTERNET"]


def test_temporary_upload_removed_after_analysis(monkeypatch: pytest.MonkeyPatch) -> None:
    seen: list[Path] = []
    def fake_analyze(path: Path, category: str) -> object:
        seen.append(path)
        assert path.exists()
        raise analyzer.InvalidApk("test failure")
    monkeypatch.setattr(analyzer, "analyze_path", fake_analyze)
    async def exercise() -> None:
        upload = type("Upload", (), {})()
        content = make_zip()
        consumed = False
        async def read(_: int) -> bytes:
            nonlocal consumed
            if consumed:
                return b""
            consumed = True
            return content
        async def close() -> None:
            return None
        upload.read, upload.close = read, close
        with pytest.raises(analyzer.InvalidApk):
            await analyzer.analyze_upload(upload, "utility")
    asyncio.run(exercise())
    assert seen and not seen[0].exists()


def test_unclassified_permission_handling() -> None:
    findings = [
        {"name": "custom.permission.INTERNAL_SYNC", "protection_level": None, "risk": "Unclassified",
         "category_classification": "Unclassified", "group": None, "explanation": "Unclassified", "source": None},
        {"name": "android.permission.INTERNET", "protection_level": "normal", "risk": "Low",
         "category_classification": "Expected", "group": "NETWORK", "explanation": "Internet", "source": "https://android.com"},
    ]
    score, grade, deductions = calculate_score(findings, [], 34, False, False)
    assert score == 100
    assert grade == "Good"
    assert len(deductions) == 0


def test_app_store_category_and_comparison() -> None:
    from app.knowledge import load_knowledge
    kb = load_knowledge()
    assert "app_store" in kb["categories"]
    app_store_rules = kb["categories"]["app_store"]["permissions"]
    social_rules = kb["categories"]["social"]["permissions"]

    # In app_store, REQUEST_INSTALL_PACKAGES is Expected
    assert app_store_rules.get("android.permission.REQUEST_INSTALL_PACKAGES") == "Expected"
    # In social, REQUEST_INSTALL_PACKAGES is Unusual
    assert social_rules.get("android.permission.REQUEST_INSTALL_PACKAGES") == "Unusual"


def test_exodus_tracker_dataset_validity() -> None:
    from app.knowledge import load_knowledge
    kb = load_knowledge()
    trackers = kb["trackers"]
    assert len(trackers) >= 400
    valid_categories = {"advertising", "profiling", "analytics", "crash_reporting"}
    for tid, t in trackers.items():
        assert "name" in t and len(t["name"]) > 0
        assert "signature" in t and len(t["signature"]) > 0
        assert t["category"] in valid_categories
        assert "Exodus Privacy" in t["attribution"]
        assert "ODbL" in t.get("license", "") or "DBCL" in t.get("license", "")


def test_permissions_dataset_validity() -> None:
    from app.knowledge import load_knowledge
    kb = load_knowledge()
    perms = kb["permissions"]
    assert len(perms) >= 80
    valid_risks = {"Critical", "High", "Moderate", "Low", "Unclassified"}
    valid_grant_mechanisms = {"runtime", "install_time", "special_app_access", "signature_restricted"}
    for name, p in perms.items():
        assert p["risk"] in valid_risks
        assert "explanation" in p and len(p["explanation"]) > 10
        assert "protection_level" in p
        assert "platform_protection_level" in p
        # platform_protection_level must never be "special"
        assert p["platform_protection_level"] != "special"
        assert p["protection_level"] != "special"
        assert p.get("grant_mechanism") in valid_grant_mechanisms
        assert "source" in p
        assert p.get("verified_at") == "2026-10-30"


def test_scoring_deduction_sum_matches_final_score() -> None:
    from app.scoring import calculate_score
    permissions = [
        {"name": "p1", "risk": "Critical", "category_classification": "Review", "group": "G1"},
        {"name": "p2", "risk": "High", "category_classification": "Expected", "group": "G1"},
        {"name": "p3", "risk": "Moderate", "category_classification": "Unusual", "group": "G2"},
        {"name": "p4", "risk": "Unclassified", "category_classification": "Unclassified", "group": None},
    ]
    trackers = [
        {"tracker_id": "t1", "category": "advertising"},
        {"tracker_id": "t2", "category": "profiling"},
        {"tracker_id": "t3", "category": "analytics"},
        {"tracker_id": "t4", "category": "crash_reporting"},
    ]
    score, grade, deductions = calculate_score(permissions, trackers, 28, True, False)
    total_deductions = sum(d["points"] for d in deductions)
    from decimal import Decimal, ROUND_HALF_UP
    expected_score = max(0, min(100, int(Decimal(str(100 - total_deductions)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))))
    assert score == expected_score
    assert grade in {"Good", "Fair", "Risky", "Poor"}


# ==================== NEW SIGNATURE FEATURES TEST SUITE ====================

def test_permission_api_mappings_integrity() -> None:
    from app.knowledge import load_knowledge
    kb = load_knowledge()
    mappings = kb["api_mappings"]
    assert len(mappings) >= 30
    for m in mappings:
        assert "permission" in m and m["permission"].startswith(("android.permission.", "com.google.android."))
        assert "api_class" in m and len(m["api_class"]) > 0
        assert "evidence_level" in m and m["evidence_level"] == "direct_method_reference"
        assert "source" in m and m["source"].startswith("http")


def test_passport_creation_and_canonical_integrity() -> None:
    from app.passport import create_passport, verify_passport, compute_payload_hash
    from app.knowledge import DATA_DIR
    import hashlib

    report_mock = {
        "scan_id": "test_scan_123",
        "apk_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "package_name": "com.example.testapp",
        "app_name": "TestApp",
        "version_name": "1.0",
        "version_code": 100,
        "min_sdk": 24,
        "target_sdk": 33,
        "compile_sdk": 33,
        "category": "communication",
        "score": 85,
        "grade": "Good",
        "deductions": [{"domain": "permissions", "item": "READ_CONTACTS", "points": 15.0, "explanation": "Risk"}],
        "permissions": [
            {
                "name": "android.permission.READ_CONTACTS",
                "risk": "High",
                "category_classification": "Review",
                "explanation": "Access contacts",
            }
        ],
        "trackers": [],
        "security_findings": [],
        "privacy_xray": {
            "total_permissions_examined": 1,
            "permissions_with_references": 1,
            "permissions_no_reference_observed": 0,
            "permissions_not_assessed": 0,
        },
        "limitations": ["Static analysis only"],
    }
    dataset_fps = {"permissions.json": "abc12345", "trackers.json": "def67890"}

    # 1. Create passport
    passport = create_passport(report_mock, dataset_fps, commit_id="test_commit")
    assert passport.schema_version == "1.0.0"
    assert passport.is_signed is True
    assert passport.signature is not None
    assert passport.public_key_fingerprint is not None
    assert passport.qr_png_base64 is not None

    # 2. Verify legitimate passport
    resp = verify_passport(passport)
    assert resp.is_valid is True
    assert resp.payload_hash_match is True
    assert resp.signature_valid is True
    assert resp.trusted_signer is True

    # 3. Tampering test: modify score
    tampered_score = passport.model_copy(deep=True)
    tampered_score.payload.score = 99
    tampered_resp = verify_passport(tampered_score)
    assert tampered_resp.is_valid is False
    assert tampered_resp.payload_hash_match is False
    assert "Tampering detected" in tampered_resp.message

    # 4. Tampering test: modify permission finding
    tampered_perm = passport.model_copy(deep=True)
    tampered_perm.payload.permissions[0].risk = "Low"
    tampered_perm_resp = verify_passport(tampered_perm)
    assert tampered_perm_resp.is_valid is False
    assert tampered_perm_resp.payload_hash_match is False

    # 5. Tampering test: modify APK hash
    tampered_apk = passport.model_copy(deep=True)
    tampered_apk.payload.apk_sha256 = "0000000000000000000000000000000000000000000000000000000000000000"
    tampered_apk_resp = verify_passport(tampered_apk)
    assert tampered_apk_resp.is_valid is False
    assert tampered_apk_resp.payload_hash_match is False

    # 6. Tampering test: modify signature
    tampered_sig = passport.model_copy(deep=True)
    tampered_sig.signature = "aa" * len(bytes.fromhex(passport.signature))
    tampered_sig_resp = verify_passport(tampered_sig)
    assert tampered_sig_resp.is_valid is False
    assert tampered_sig_resp.payload_hash_match is True  # payload is untouched
    assert tampered_sig_resp.signature_valid is False

    # 7. Untrusted key fingerprint test
    untrusted_key = passport.model_copy(deep=True)
    untrusted_key.public_key_fingerprint = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    untrusted_resp = verify_passport(untrusted_key)
    assert untrusted_resp.is_valid is False
    assert untrusted_resp.trusted_signer is False
    assert "Untrusted signer" in untrusted_resp.message

    # 8. Unsigned / Hash-only passport verification
    unsigned_passport = passport.model_copy(deep=True)
    unsigned_passport.is_signed = False
    unsigned_passport.signature = None
    unsigned_passport.public_key_fingerprint = None
    unsigned_resp = verify_passport(unsigned_passport)
    assert unsigned_resp.is_valid is True
    assert unsigned_resp.payload_hash_match is True
    assert unsigned_resp.signature_valid is None
    assert "unsigned" in unsigned_resp.message.lower()


def test_passport_verify_api_endpoint() -> None:
    from fastapi.testclient import TestClient
    from app.main import app
    from app.passport import create_passport

    client = TestClient(app)
    mock_report = {
        "scan_id": "test_scan",
        "apk_sha256": "1234567890abcdef",
        "package_name": "com.test.passport",
        "category": "utility",
        "score": 90,
        "grade": "Good",
        "deductions": [],
        "permissions": [],
        "trackers": [],
        "security_findings": [],
        "limitations": [],
    }
    passport = create_passport(mock_report, {})

    # Valid verify request
    res = client.post("/api/v1/passport/verify", json={"passport": passport.model_dump(mode="json")})
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True
    assert data["payload_hash_match"] is True

    # Tampered verify request
    tampered_dict = passport.model_dump(mode="json")
    tampered_dict["payload"]["score"] = 10
    res_tampered = client.post("/api/v1/passport/verify", json={"passport": tampered_dict})
    assert res_tampered.status_code == 200
    data_tampered = res_tampered.json()
    assert data_tampered["is_valid"] is False
    assert data_tampered["payload_hash_match"] is False


def test_radar_compare_api_rejects_identical_and_mismatched() -> None:
    from fastapi.testclient import TestClient
    from app.main import app
    import zipfile
    import io

    client = TestClient(app)

    real_apk_path = "/home/admin/Downloads/viruses-24hours.apk"
    with zipfile.ZipFile(real_apk_path) as z:
        entries = {name: z.read(name) for name in z.namelist()}

    # Base APK 1
    buf1 = io.BytesIO()
    with zipfile.ZipFile(buf1, "w") as z1:
        for k, v in entries.items():
            z1.writestr(k, v)
    apk_bytes_1 = buf1.getvalue()

    # Base APK 2 with extra asset (different SHA-256, same package)
    buf2 = io.BytesIO()
    with zipfile.ZipFile(buf2, "w") as z2:
        for k, v in entries.items():
            z2.writestr(k, v)
        z2.writestr("assets/patch_v2.txt", b"v2")
    apk_bytes_2 = buf2.getvalue()

    # 1. Identical APK rejection
    res_identical = client.post(
        "/api/v1/compare",
        data={"category": "app_store"},
        files={
            "old_file": ("v1.apk", apk_bytes_1, "application/vnd.android.package-archive"),
            "new_file": ("v2.apk", apk_bytes_1, "application/vnd.android.package-archive"),
        },
    )
    assert res_identical.status_code == 400
    assert "Identical APKs detected" in res_identical.json()["detail"]

    # 2. Invalid category rejection
    res_bad_cat = client.post(
        "/api/v1/compare",
        data={"category": "unsupported_xyz"},
        files={
            "old_file": ("v1.apk", apk_bytes_1, "application/vnd.android.package-archive"),
            "new_file": ("v2.apk", apk_bytes_2, "application/vnd.android.package-archive"),
        },
    )
    assert res_bad_cat.status_code == 422


def test_radar_compare_two_versions_differential() -> None:
    from fastapi.testclient import TestClient
    from app.main import app
    import zipfile
    import io

    client = TestClient(app)

    real_apk_path = "/home/admin/Downloads/viruses-24hours.apk"
    with zipfile.ZipFile(real_apk_path) as z:
        entries = {name: z.read(name) for name in z.namelist()}

    # v1 (original APK)
    buf1 = io.BytesIO()
    with zipfile.ZipFile(buf1, "w") as z1:
        for k, v in entries.items():
            z1.writestr(k, v)
    v1_bytes = buf1.getvalue()

    # v2 (modified version with asset stamp)
    buf2 = io.BytesIO()
    with zipfile.ZipFile(buf2, "w") as z2:
        for k, v in entries.items():
            z2.writestr(k, v)
        z2.writestr("assets/update_meta.json", b'{"version": "10.0.1"}')
    v2_bytes = buf2.getvalue()

    res = client.post(
        "/api/v1/compare",
        data={"category": "app_store"},
        files={
            "old_file": ("app-v1.apk", v1_bytes, "application/vnd.android.package-archive"),
            "new_file": ("app-v2.apk", v2_bytes, "application/vnd.android.package-archive"),
        },
    )
    assert res.status_code == 200
    data = res.json()

    assert data["package_name"] == "cm.aptoide.pt"
    assert data["retained_permissions_count"] >= 20
    assert "Compared" in data["summary_text"]
    assert "score_change" in data
    assert "old_score" in data["score_change"]
    assert "new_score" in data["score_change"]
