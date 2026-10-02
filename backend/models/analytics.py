"""Response models for the forecast + stats endpoints.

Mirrored by hand in frontend/src/types.ts — keep in sync.
"""

from pydantic import BaseModel


class SeriesFit(BaseModel):
    """Result of the least-squares fit for one series: fitted = intercept + slope * t."""

    slope: float
    intercept: float
    r2: float


class TrendPoint(BaseModel):
    """One point on the spend trend chart — actual data or the projected future point."""

    month: str | None  # None only if the projection has no month key (never in practice)
    t: int
    actual: float | None
    fitted: float
    projected: bool


class MatrixBreakdown(BaseModel):
    """The matrices behind the normal equations, rounded for display in the math inspector."""

    labels: list[str]
    weights: list[float]
    X: list[list[float]]  # design matrix [n x 2]: rows [1, t]
    y_spend: list[float]
    y_save: list[float]
    XtX: list[list[float]]  # 2x2 normal matrix
    XtX_inv: list[list[float]] | None  # None when singular (single closed month)
    Xty_spend: list[float]
    Xty_save: list[float]
    theta_spend: list[float]  # [intercept, slope]
    theta_save: list[float]  # [intercept, slope]
    r2_spend: float
    r2_save: float


class Forecast(BaseModel):
    target_month: str | None
    has_history: bool
    months_used: int
    income_next: float | None = None
    recommended_spend: float | None = None
    recommended_save: float | None = None
    trend_spend: float | None = None
    trend_save: float | None = None
    spend_fit: SeriesFit | None = None
    save_fit: SeriesFit | None = None
    plan_gap_spend: float | None = None  # last closed month: actual - planned (+ = overspent)
    base_plan_spend: float | None = None  # the user's own plan for the target month, if any
    base_plan_save: float | None = None
    vs_plan_spend: float | None = None  # recommendation - plan (+ = spend more than planned)
    vs_plan_save: float | None = None
    trend_series: list[TrendPoint] = []
    matrix: MatrixBreakdown | None = None
    notes: list[str] = []
    method: str = "θ = (XᵀWX)⁻¹XᵀWy — weighted least squares, X = [[1, t]], W = diag(recency weights)"


class MonthSeriesPoint(BaseModel):
    month: str
    planned_spend: float
    actual_spend: float | None
    planned_save: float
    actual_save: float | None


class CategorySlice(BaseModel):
    category: str
    amount: float


class Stats(BaseModel):
    """Aggregates that feed the KPI cards and charts."""

    months: list[MonthSeriesPoint] = []
    categories_total: list[CategorySlice] = []
    categories_last: list[CategorySlice] | None = None
    last_closed_month: str | None = None
    total_saved: float = 0.0
    total_closed_income: float = 0.0
    avg_spend: float | None = None
    savings_rate: float | None = None
    months_tracked: int = 0
    closed_months: int = 0
