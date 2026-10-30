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
        assert "AGPL" in t.get("license", "") or "CC" in t.get("license", "")


def test_permissions_dataset_validity() -> None:
    from app.knowledge import load_knowledge
    kb = load_knowledge()
    perms = kb["permissions"]
    assert len(perms) >= 80
    valid_risks = {"Critical", "High", "Moderate", "Low", "Unclassified"}
    for name, p in perms.items():
        assert p["risk"] in valid_risks
        assert "explanation" in p and len(p["explanation"]) > 10
        assert "protection_level" in p
        assert "source" in p
        assert p.get("verified_at") == "2026-10-30"
