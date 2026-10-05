"""Read-only analytics: /api/forecast (the linear-algebra engine) and /api/stats.

Forecast = weighted least squares over closed months, solved with the normal
equations θ = (XᵀWX)⁻¹ Xᵀ W y on the design matrix X = [[1, t]]. Last month's
plan-vs-actual gap throttles (or releases) next month's spend ceiling; the
savings recommendation is the budget identity income − spend.
"""

import numpy as np
from fastapi import APIRouter
from pymongo import ASCENDING

from lib.db import db
from lib.forecast import shift_month, wls_fit
from models.analytics import (
    CategorySlice,
    Forecast,
    MatrixBreakdown,
    MonthCategories,
    MonthSeriesPoint,
    SeriesFit,
    Stats,
    TrendPoint,
)
from models.month import CATEGORIES

router = APIRouter(tags=["analytics"])

LAMBDA = 0.6  # share of last month's plan-vs-actual gap carried into next month's ceiling


def _r2(x) -> float:
    return round(float(x), 2)


def _fmt(x: float) -> str:
    return f"₹{x:,.0f}"


def _matrix_breakdown(
    closed: list[dict],
    X: np.ndarray,
    weights: np.ndarray,
    y_spend: list[float],
    y_save: list[float],
    theta_s: np.ndarray,
    theta_v: np.ndarray,
    r2_s: float,
    r2_v: float,
) -> MatrixBreakdown:
    XtW = X.T @ np.diag(weights)
    XtX = XtW @ X
    try:
        XtX_inv = [[_r2(v) for v in row] for row in np.linalg.inv(XtX)]
    except np.linalg.LinAlgError:
        XtX_inv = None
    return MatrixBreakdown(
        labels=[c["month"] for c in closed],
        weights=[_r2(w) for w in weights],
        X=[[_r2(v) for v in row] for row in X],
        y_spend=[_r2(v) for v in y_spend],
        y_save=[_r2(v) for v in y_save],
        XtX=[[_r2(v) for v in row] for row in XtX],
        XtX_inv=XtX_inv,
        Xty_spend=[_r2(v) for v in (XtW @ np.asarray(y_spend))],
        Xty_save=[_r2(v) for v in (XtW @ np.asarray(y_save))],
        theta_spend=[_r2(v) for v in theta_s],
        theta_save=[_r2(v) for v in theta_v],
        r2_spend=_r2(r2_s),
        r2_save=_r2(r2_v),
    )


@router.get("/forecast", response_model=Forecast)
async def get_forecast():
    docs = await db.months.find().sort("month", ASCENDING).to_list(1000)
    closed = [d for d in docs if d.get("actual_spend") is not None]
    by_month = {d["month"]: d for d in docs}

    if not closed:
        # Cold start: echo the newest plan as the working budget until real history exists.
        target = docs[-1]["month"] if docs else None
        base = by_month.get(target) if target else None
        notes = ["No closed months yet — this is your plan echoed back, not a regression forecast."]
        if base:
            notes.insert(0, f"Working budget for {target}: spend {_fmt(base['planned_spend'])}, save {_fmt(base['planned_save'])}.")
        notes.append("Log your first month's actuals and the least-squares engine (θ = (XᵀWX)⁻¹XᵀWy) activates.")
        return Forecast(
            target_month=target,
            has_history=False,
            months_used=0,
            income_next=base["income"] if base else None,
            recommended_spend=base["planned_spend"] if base else None,
            recommended_save=base["planned_save"] if base else None,
            base_plan_spend=base["planned_spend"] if base else None,
            base_plan_save=base["planned_save"] if base else None,
            notes=notes,
        )

    n = len(closed)
    t = list(range(n))
    y_spend = [float(c["actual_spend"]) for c in closed]
    y_save = [float(c.get("actual_save") or 0.0) for c in closed]
    y_income = [float(c["income"]) for c in closed]

    theta_s, fitted_s, r2_s, X, weights = wls_fit(t, y_spend)
    theta_v, fitted_v, r2_v, _, _ = wls_fit(t, y_save)
    theta_i, _, _, _, _ = wls_fit(t, y_income)

    target = shift_month(closed[-1]["month"], 1)
    next_t = float(n)
    trend_spend = max(float(theta_s[0] + theta_s[1] * next_t), 0.0)
    trend_save = max(float(theta_v[0] + theta_v[1] * next_t), 0.0)
    income_next = max(float(theta_i[0] + theta_i[1] * next_t), 0.0)

    last = closed[-1]
    plan_gap = float(last["actual_spend"]) - float(last["planned_spend"])  # + = overspent
    recommended_spend = min(max(trend_spend - LAMBDA * plan_gap, 0.0), income_next)
    recommended_save = min(max(income_next - recommended_spend, 0.0), income_next)

    base = by_month.get(target)
    vs_plan_spend = round(recommended_spend - float(base["planned_spend"]), 2) if base else None
    vs_plan_save = round(recommended_save - float(base["planned_save"]), 2) if base else None

    notes: list[str] = []
    if plan_gap > 0.5:
        notes.append(
            f"Last month you overspent your plan by {_fmt(plan_gap)} — the engine throttles "
            f"next month's spend ceiling by {LAMBDA:.0%} of that gap ({_fmt(LAMBDA * plan_gap)})."
        )
    elif plan_gap < -0.5:
        notes.append(
            f"Last month came in {_fmt(-plan_gap)} under plan — {_fmt(LAMBDA * -plan_gap)} of it releases "
            f"as extra spending headroom next month, the rest locks into savings."
        )
    else:
        notes.append("Last month landed on plan — no surplus or deficit correction applied.")

    slope_s = float(theta_s[1])
    if slope_s > 1:
        notes.append(f"Spend trend is rising {_fmt(slope_s)}/month (slope m from θ = (XᵀWX)⁻¹XᵀWy).")
    elif slope_s < -1:
        notes.append(f"Spend trend is falling {_fmt(-slope_s)}/month (slope m from θ = (XᵀWX)⁻¹XᵀWy).")
    else:
        notes.append("Spend trend is essentially flat month over month.")

    notes.append(f"Fit confidence R² = {r2_s:.2f} on {n} closed month{'s' if n != 1 else ''}.")
    if n < 3:
        notes.append("Confidence improves as you log 3+ months — the 2×2 normal matrix XᵀWX needs spread in t.")
    notes.append("Recommended savings = projected income − recommended spend, so income = spend + savings always holds.")
    if base and vs_plan_spend is not None:
        direction = "below" if vs_plan_spend < 0 else "above"
        notes.append(
            f"Your plan for {target}: spend {_fmt(base['planned_spend'])}, save {_fmt(base['planned_save'])} "
            f"— the engine sits {direction} on spend."
        )

    trend_series = [
        TrendPoint(month=c["month"], t=i, actual=y_spend[i], fitted=_r2(fitted_s[i]), projected=False)
        for i, c in enumerate(closed)
    ]
    trend_series.append(
        TrendPoint(month=target, t=n, actual=None, fitted=_r2(trend_spend), projected=True)
    )

    return Forecast(
        target_month=target,
        has_history=True,
        months_used=n,
        income_next=round(income_next, 2),
        recommended_spend=round(recommended_spend, 2),
        recommended_save=round(recommended_save, 2),
        trend_spend=round(trend_spend, 2),
        trend_save=round(trend_save, 2),
        spend_fit=SeriesFit(slope=round(slope_s, 4), intercept=_r2(theta_s[0]), r2=_r2(r2_s)),
        save_fit=SeriesFit(slope=round(float(theta_v[1]), 4), intercept=_r2(theta_v[0]), r2=_r2(r2_v)),
        plan_gap_spend=round(plan_gap, 2),
        base_plan_spend=base["planned_spend"] if base else None,
        base_plan_save=base["planned_save"] if base else None,
        vs_plan_spend=vs_plan_spend,
        vs_plan_save=vs_plan_save,
        trend_series=trend_series,
        matrix=_matrix_breakdown(closed, X, weights, y_spend, y_save, theta_s, theta_v, r2_s, r2_v),
        notes=notes,
    )


@router.get("/stats", response_model=Stats)
async def get_stats():
    docs = await db.months.find().sort("month", ASCENDING).to_list(1000)
    closed = [d for d in docs if d.get("actual_spend") is not None]

    months = [
        MonthSeriesPoint(
            month=d["month"],
            planned_spend=float(d["planned_spend"]),
            actual_spend=float(d["actual_spend"]) if d.get("actual_spend") is not None else None,
            planned_save=float(d["planned_save"]),
            actual_save=float(d["actual_save"]) if d.get("actual_save") is not None else None,
        )
        for d in docs
    ]

    def _slices(source: dict) -> list[CategorySlice]:
        pairs = [
            (k, float(v))
            for k, v in (source.get("categories") or {}).items()
            if k in CATEGORIES and float(v) > 0
        ]
        pairs.sort(key=lambda kv: -kv[1])
        return [CategorySlice(category=k, amount=_r2(v)) for k, v in pairs]

    cat_total: dict[str, float] = {}
    for c in closed:
        for k, v in (c.get("categories") or {}).items():
            if k in CATEGORIES:
                cat_total[k] = cat_total.get(k, 0.0) + float(v)

    # Per-month breakdowns (chronological) — the pie chart's "pick a previous month" view.
    categories_by_month = [
        MonthCategories(
            month=c["month"],
            total=_r2(sum(float(v) for v in (c.get("categories") or {}).values())),
            slices=_slices(c),
        )
        for c in closed
    ]

    total_saved = sum(float(c["actual_save"] or 0.0) for c in closed)
    total_income = sum(float(c["income"]) for c in closed)
    spends = [float(c["actual_spend"]) for c in closed]

    return Stats(
        months=months,
        categories_total=[CategorySlice(category=k, amount=_r2(v)) for k, v in sorted(cat_total.items(), key=lambda kv: -kv[1])],
        categories_last=_slices(closed[-1]) if closed else None,
        categories_by_month=categories_by_month,
        last_closed_month=closed[-1]["month"] if closed else None,
        total_saved=_r2(total_saved),
        total_closed_income=_r2(total_income),
        avg_spend=_r2(sum(spends) / len(spends)) if spends else None,
        savings_rate=_r2(100.0 * total_saved / total_income) if total_income > 0 else None,
        months_tracked=len(docs),
        closed_months=len(closed),
    )
