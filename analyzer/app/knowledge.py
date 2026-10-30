"""Validated local JSON knowledge base loading."""
import json
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


def load_json(name: str) -> dict[str, Any]:
    path = DATA_DIR / name
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Knowledge base {name} could not be loaded") from exc
    if not isinstance(value, dict):
        raise RuntimeError(f"Knowledge base {name} must contain a JSON object")
    return value


def load_json_list(name: str) -> list[Any]:
    path = DATA_DIR / name
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Knowledge base {name} could not be loaded") from exc
    if not isinstance(value, list):
        raise RuntimeError(f"Knowledge base {name} must contain a JSON array")
    return value


def load_knowledge() -> dict[str, Any]:
    permissions = load_json("permissions.json")
    categories = load_json("categories.json")
    trackers = load_json("trackers.json")
    revoke_steps = load_json("revoke_steps.json")
    api_mappings = load_json_list("permission_api_mappings.json")
    for key, item in permissions.items():
        if not isinstance(item, dict) or item.get("risk") not in {"Critical", "High", "Moderate", "Low"}:
            raise RuntimeError(f"Invalid permission entry: {key}")
        if not all(isinstance(item.get(field), str) for field in ("group", "explanation", "source")):
            raise RuntimeError(f"Incomplete permission entry: {key}")
    for category, spec in categories.items():
        if not isinstance(spec, dict) or not isinstance(spec.get("permissions"), dict):
            raise RuntimeError(f"Invalid category entry: {category}")
        if any(value not in {"Expected", "Review", "Unusual"} for value in spec["permissions"].values()):
            raise RuntimeError(f"Invalid classification in category: {category}")
    for tracker_id, item in trackers.items():
        if not isinstance(item, dict) or not all(isinstance(item.get(k), str) and item[k] for k in ("name", "category", "signature_type", "signature", "source", "attribution")):
            raise RuntimeError(f"Invalid tracker entry: {tracker_id}")
    if any(not isinstance(item, dict) or not isinstance(item.get("steps"), list) for item in revoke_steps.values()):
        raise RuntimeError("Invalid permission revocation guidance")
    for mapping in api_mappings:
        if not isinstance(mapping, dict) or not mapping.get("permission") or not mapping.get("api_class"):
            raise RuntimeError("Invalid permission-to-API mapping entry")
    return {
        "permissions": permissions,
        "categories": categories,
        "trackers": trackers,
        "revoke_steps": revoke_steps,
        "api_mappings": api_mappings,
    }

