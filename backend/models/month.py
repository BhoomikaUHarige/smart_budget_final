"""Monthly budget documents: the plan you set, and the actuals you log at month end.

Money values are INR rupees (floats, rounded to 2dp). Mirrored by hand in
frontend/src/types.ts as `Month` / `MonthCreate` / `MonthUpdate` — keep in sync.
"""

import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field

# Fixed spending categories — the pie chart slices. Mirrored in frontend/src/lib/categories.ts.
CATEGORIES = [
    "Housing",
    "Groceries",
    "Transport",
    "Utilities",
    "Entertainment",
    "Health",
    "Shopping",
    "Other",
]

MONTH_PATTERN = r"^\d{4}-(0[1-9]|1[0-2])$"


def utcnow() -> datetime:
    """Aware UTC now — store aware so Pydantic serialises an offset JavaScript can parse."""
    return datetime.now(timezone.utc)


class Month(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    month: str = Field(pattern=MONTH_PATTERN)  # "YYYY-MM", unique per plan
    income: float = Field(ge=0)  # expected income for the month
    planned_spend: float = Field(ge=0)
    planned_save: float = Field(ge=0)
    actual_spend: float | None = None  # filled when actuals are logged
    actual_save: float | None = None
    categories: dict[str, float] = Field(default_factory=dict)  # category -> actual spend
    closed: bool = False  # True once actuals exist
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class MonthCreate(BaseModel):
    month: str = Field(pattern=MONTH_PATTERN)
    income: float = Field(ge=0)
    planned_spend: float = Field(ge=0)
    planned_save: float = Field(ge=0)


class MonthUpdate(BaseModel):
    """PATCH body — every field optional; when `categories` is sent it recomputes actual_spend."""

    month: str | None = Field(default=None, pattern=MONTH_PATTERN)
    income: float | None = Field(default=None, ge=0)
    planned_spend: float | None = Field(default=None, ge=0)
    planned_save: float | None = Field(default=None, ge=0)
    actual_spend: float | None = Field(default=None, ge=0)  # only used when categories absent
    actual_save: float | None = Field(default=None, ge=0)
    categories: dict[str, float] | None = None
