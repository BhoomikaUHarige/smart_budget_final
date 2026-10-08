"""Criterion: Submitting the actuals dialog persists the auto-calculated savings.

Backend half of the API-backed UI criterion: PATCH /api/months/{id} with categories
recomputes actual_spend, and actual_save (income - spend) is stored/returned as sent.
"""

import time

import pytest


def _unique_month():
    # pick a month far in the future, unlikely to collide with seed data (2026-07..09)
    epoch_min = int(time.time() // 60) % 12 + 1
    return f"2031-{epoch_min:02d}"


@pytest.fixture
def fixture_month(client):
    month = _unique_month()
    # clean up any leftover from a previous run of this exact month before creating
    resp = client.post(
        "/months",
        json={
            "month": month,
            "income": 50000,
            "planned_spend": 35000,
            "planned_save": 15000,
        },
    )
    if resp.status_code == 422 or resp.status_code == 409:
        # already exists from a prior run (same minute) - fetch it instead
        listing = client.get("/months").json()
        existing = next((m for m in listing if m["month"] == month), None)
        assert existing is not None, f"could not create or find fixture month {month}: {resp.text}"
        yield existing
        return
    assert resp.status_code == 201, resp.text
    data = resp.json()
    yield data


def test_patch_actuals_persists_auto_calculated_savings(client, fixture_month):
    month_id = fixture_month["id"]

    categories = {
        "Housing": 15000,
        "Groceries": 5000,
        "Transport": 5000,
        "Utilities": 0,
        "Entertainment": 0,
        "Health": 0,
        "Shopping": 0,
        "Other": 0,
    }
    total_spend = sum(categories.values())
    income = 60000
    auto_save = income - total_spend  # 35000

    resp = client.patch(
        f"/months/{month_id}",
        json={
            "income": income,
            "categories": categories,
            "actual_save": auto_save,
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()

    assert body["income"] == income
    assert body["actual_spend"] == total_spend, body
    assert body["actual_save"] == auto_save, body

    # Re-fetch to confirm persistence (not just echoed response)
    listing = client.get("/months").json()
    persisted = next((m for m in listing if m["id"] == month_id), None)
    assert persisted is not None
    assert persisted["actual_spend"] == total_spend
    assert persisted["actual_save"] == auto_save
