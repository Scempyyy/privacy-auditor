"""Deterministic implementation of docs/SCORING.md."""
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

BASE = {"Critical": 10.0, "High": 6.0, "Moderate": 3.0, "Low": 0.0}
MULTIPLIER = {"Expected": 0.25, "Review": 1.0, "Unusual": 1.5}


def calculate_score(permissions: list[dict[str, Any]], trackers: list[dict[str, Any]],
                    target_sdk: int | None, cleartext: bool, debuggable: bool) -> tuple[int, str, list[dict[str, Any]]]:
    deductions: list[dict[str, Any]] = []
    grouped: dict[str, list[tuple[str, float]]] = defaultdict(list)
    for permission in permissions:
        risk = permission["risk"]
        classification = permission["category_classification"]
        cost = BASE.get(risk, 0.0) * MULTIPLIER.get(classification, 1.0)
        group = permission.get("group") or permission["name"]
        grouped[group].append((permission["name"], cost))
    raw_permission = 0.0
    permission_items: list[tuple[str, float, str]] = []
    for group, items in grouped.items():
        items.sort(key=lambda item: (-item[1], item[0]))
        for index, (name, cost) in enumerate(items):
            effective = cost if index == 0 else cost * 0.25
            raw_permission += effective
            permission_items.append((name, effective, group))
    remaining = 60.0
    for name, effective, group in permission_items:
        charged = min(effective, remaining)
        remaining -= charged
        if charged:
            deductions.append({"domain": "permissions", "item": name, "points": charged,
                               "explanation": f"{group} group deduplication and risk/classification weight; permission domain cap is 60."})
    p = min(raw_permission, 60.0)

    category_caps = {"advertising": (4.0, 20.0), "profiling": (5.0, 15.0), "analytics": (2.0, 10.0), "crash_reporting": (0.0, 0.0)}
    tracker_sum = 0.0
    tracker_remaining = 30.0
    for category, (weight, cap) in category_caps.items():
        count = sum(1 for tracker in trackers if tracker["category"] == category)
        raw = count * weight
        charged = min(raw, cap)
        charged = min(charged, tracker_remaining)
        tracker_remaining -= charged
        tracker_sum += charged
        if charged:
            deductions.append({"domain": "trackers", "item": f"{category} SDKs ({count})", "points": charged,
                               "explanation": f"{weight:g} points per detected signature, category cap {cap:g}."})
    t = min(tracker_sum, 30.0)

    security = 0.0
    def add_security(item: str, points: float, explanation: str) -> None:
        nonlocal security
        charged = min(points, max(0.0, 15.0 - security))
        security += charged
        if charged:
            deductions.append({"domain": "security", "item": item, "points": charged,
                               "explanation": f"{explanation} Hygiene domain cap is 15."})
    if cleartext:
        add_security("Cleartext traffic allowed", 5, "Manifest permits cleartext network traffic.")
    if target_sdk is not None and target_sdk < 23:
        add_security("Target SDK below 23", 10, "Legacy target lacks the runtime permission model.")
    elif target_sdk is not None and target_sdk <= 29:
        add_security("Target SDK 23–29", 4, "Target predates modern Android privacy controls.")
    if debuggable:
        add_security("Debuggable build", 8, "Manifest marks the application debuggable.")
    s = min(security, 15.0)
    score = max(0, min(100, int(Decimal(str(100 - p - t - s)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))))
    grade = "Good" if score >= 80 else "Fair" if score >= 60 else "Risky" if score >= 40 else "Poor"
    return score, grade, deductions
