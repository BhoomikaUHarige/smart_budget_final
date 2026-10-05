"""CRUD for monthly budget plans (planned goals + logged actuals)."""

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException, Response
from pymongo import ASCENDING

from lib.dates import today_iso
from lib.db import db
from lib.forecast import shift_month
from models.month import CATEGORIES, Month, MonthCreate, MonthUpdate, ResetResult, utcnow

router = APIRouter(prefix="/months", tags=["months"])

# (month offset, income, planned spend, planned save, categories, actual savings)
DEMO_MONTHS: list[tuple[int, float, float, float, dict[str, float], float]] = [
    (
        -3, 50000, 35000, 15000,
        {"Housing": 15000, "Groceries": 8200, "Transport": 3600, "Utilities": 2400,
         "Entertainment": 3100, "Health": 1500, "Shopping": 2200, "Other": 800},
        12800,
    ),
    (
        -2, 50000, 34000, 16000,
        {"Housing": 15000, "Groceries": 7400, "Transport": 3100, "Utilities": 2300,
         "Entertainment": 2100, "Health": 1200, "Shopping": 1600, "Other": 300},
        16100,
    ),
    (
        -1, 52000, 36000, 16000,
        {"Housing": 15000, "Groceries": 9800, "Transport": 4200, "Utilities": 2600,
         "Entertainment": 4400, "Health": 1800, "Shopping": 1900, "Other": 500},
        11400,
    ),
]


def _from_doc(doc: dict) -> Month:
    """Motor hands back naive datetimes — normalise to aware UTC before validating."""
    for key in ("created_at", "updated_at"):
        if isinstance(doc.get(key), datetime):
            doc[key] = doc[key].replace(tzinfo=timezone.utc)
    return Month(**doc)


@router.get("", response_model=List[Month])
async def list_months():
    docs = await db.months.find().sort("month", ASCENDING).to_list(1000)
    return [_from_doc(d) for d in docs]


@router.post("", response_model=Month, status_code=201)
async def create_month(input: MonthCreate):
    if await db.months.find_one({"month": input.month}, {"_id": 1}):
        raise HTTPException(status_code=409, detail=f"{input.month} already has a plan — edit it instead")
    month = Month(**input.model_dump())
    await db.months.insert_one(month.model_dump())
    return month


@router.delete("", response_model=ResetResult)
async def reset_months():
    """Wipe every saved month — backs "start fresh" on the launch screen."""
    result = await db.months.delete_many({})
    return ResetResult(deleted=result.deleted_count)


@router.patch("/{month_id}", response_model=Month)
async def update_month(month_id: str, input: MonthUpdate):
    doc = await db.months.find_one({"id": month_id})
    if not doc:
        raise HTTPException(status_code=404, detail="month not found")

    updates = input.model_dump(exclude_unset=True, exclude_none=True)
    if "month" in updates and updates["month"] != doc["month"]:
        if await db.months.find_one({"month": updates["month"]}, {"_id": 1}):
            raise HTTPException(status_code=409, detail=f"{updates['month']} already has a plan")

    if "categories" in updates:
        clean = {
            k: round(float(v), 2)
            for k, v in updates["categories"].items()
            if k in CATEGORIES and float(v) > 0
        }
        updates["categories"] = clean
        updates["actual_spend"] = round(sum(clean.values()), 2)
    if "actual_spend" in updates:
        updates["actual_spend"] = round(float(updates["actual_spend"]), 2)
    if "actual_save" in updates:
        updates["actual_save"] = round(float(updates["actual_save"]), 2)
    if "actual_spend" in updates or "actual_save" in updates:
        updates["closed"] = True
    updates["updated_at"] = utcnow()

    await db.months.update_one({"id": month_id}, {"$set": updates})
    return _from_doc(await db.months.find_one({"id": month_id}))


@router.delete("/{month_id}", status_code=204)
async def delete_month(month_id: str):
    result = await db.months.delete_one({"id": month_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="month not found")
    return Response(status_code=204)


@router.post("/demo", response_model=List[Month], status_code=201)
async def load_demo_months():
    """Optional starter history (relative to the server's current month) — skips existing keys."""
    base = today_iso()[:7]  # server-side "YYYY-MM"
    created: list[Month] = []
    for offset, income, planned_spend, planned_save, categories, actual_save in DEMO_MONTHS:
        month_key = shift_month(base, offset)
        if await db.months.find_one({"month": month_key}, {"_id": 1}):
            continue
        month = Month(
            month=month_key,
            income=income,
            planned_spend=planned_spend,
            planned_save=planned_save,
            actual_spend=round(sum(categories.values()), 2),
            actual_save=actual_save,
            categories=categories,
            closed=True,
        )
        await db.months.insert_one(month.model_dump())
        created.append(month)
    return created
