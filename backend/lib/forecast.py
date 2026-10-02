"""The linear-algebra engine: weighted least squares via the normal equations.

    θ = (XᵀWX)⁻¹ Xᵀ W y        X = [[1, t₀], [1, t₁], …]   W = diag(recency weights)

One fit per series (spend, savings, income) over the closed months; the fitted
line projects the next month. All matrix work is numpy.
"""

import numpy as np


def wls_fit(t: list[int], y: list[float]) -> tuple[np.ndarray, np.ndarray, float, np.ndarray, np.ndarray]:
    """Return (theta, fitted, r2, X, weights) for y = c + m·t.

    theta = [c, m] solves the weighted normal equations. With a single data point
    the normal matrix is singular, so we fall back to numpy's rank-revealing lstsq.
    """
    t_arr = np.asarray(t, dtype=float)
    y_arr = np.asarray(y, dtype=float)
    X = np.column_stack([np.ones(len(t_arr)), t_arr])  # design matrix [n x 2]
    weights = 1.0 + 0.25 * t_arr  # recent months matter more (recency ramp)
    W = np.diag(weights)
    XtWX = X.T @ W @ X
    Xty = X.T @ W @ y_arr
    try:
        theta = np.linalg.solve(XtWX, Xty)
    except np.linalg.LinAlgError:
        theta = np.linalg.lstsq(X, y_arr, rcond=None)[0]
    fitted = X @ theta
    residual = y_arr - fitted
    y_bar = float(np.average(y_arr, weights=weights))
    ss_res = float(np.sum(weights * residual**2))
    ss_tot = float(np.sum(weights * (y_arr - y_bar) ** 2))
    r2 = 1.0 - ss_res / ss_tot if ss_tot > 1e-9 else 1.0
    return theta, fitted, r2, X, weights


def shift_month(month: str, k: int) -> str:
    """"2026-03" + 1 month -> "2026-04"; handles year rollover either direction."""
    year, mon = int(month[:4]), int(month[5:7])
    idx = year * 12 + (mon - 1) + k
    return f"{idx // 12:04d}-{idx % 12 + 1:02d}"
