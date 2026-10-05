# SmartBudget Matrix — App Spec

## What it does
A monthly budget planner with a linear-algebra forecast engine. User sets a plan at the
start of a month (expected income, planned spend, planned save), logs real end-of-month
actuals (per-category spend + actual savings), and the app estimates next month's
spend/save using weighted least squares. INR (₹) currency. App starts EMPTY by user
choice; an optional "Load 3-month demo" button (empty state) seeds 3 closed sample months.

## The math (backend/lib/forecast.py, numpy)
- Normal equations: θ = (XᵀWX)⁻¹XᵀWy, design matrix X = [[1, t]] over closed months,
  W = diag(1 + 0.25·t) recency weights. One fit each for spend, savings, income.
- Next-month projection at t = n. plan_gap = last actual_spend − last planned_spend;
  recommended_spend = clip(trend_spend − 0.6·plan_gap, 0, income_next);
  recommended_save = income_next − recommended_spend (budget identity).
- Cold start (no closed months): echoes the newest plan, engine "standby".
- GET /api/forecast returns recommendations + notes + full MatrixBreakdown
  (X, y, W, XᵀWX, (XᵀWX)⁻¹ or null-when-singular, XᵀWy, θ, R²) rendered in the
  Matrix Math Inspector dialog.

## Data model (Mongo `months` collection, uuid string ids)
Month: id, month "YYYY-MM" (unique index), income, planned_spend, planned_save,
actual_spend?, actual_save?, categories {category: ₹} (computed actual_spend = Σ),
closed, created_at, updated_at. Categories fixed: Housing, Groceries, Transport,
Utilities, Entertainment, Health, Shopping, Other (backend/models/month.py ↔
frontend/src/lib/categories.ts).

## API (all under /api, routers mounted in server.py)
- GET/POST /api/months, PATCH/DELETE /api/months/{id} (PATCH with categories recomputes
  actual_spend and sets closed), POST /api/months/demo (3 sample months, skips existing)
- GET /api/forecast, GET /api/stats (chart aggregates: per-month series, category slices,
  totals, savings rate)
- Template endpoints remain: GET /api/, POST/GET /api/status

## Frontend
Single dashboard page `/` (src/pages/Home.tsx): sticky glass header, 4 KPI cards,
forecast panel + matrix engine card, donut (category split), grouped bar (planned vs
actual spend/save), regression trend chart with projected point, monthly history ledger
with enter-actuals/edit/delete.

### Chart view options (history browsing)
- **Donut**: month `Select` (`select-pie-month`) — "All months combined" (uses
  `stats.categories_total`) or any individual closed month (`stats.categories_by_month`).
  Defaults to the newest closed month; center label shows the selected total.
- **Bar + trend charts**: shared `ChartRangeTabs` (`components/ChartRangeTabs.tsx`) with
  All / Last 3 / Last 6 / Last 12 — options only render when enough months exist
  (`applyRange()` keeps the trailing slice). Trend chart always keeps the projected
  point visible regardless of range.
- **Toggles**: bar chart "Show savings bars" (`toggle-bar-savings`, on by default);
  trend chart "Overlay actual savings" (`toggle-trend-savings`, off by default). TanStack Query everywhere; types mirrored
by hand in src/types.ts. Dark navy theme (Outfit headings, IBM Plex Sans/Mono), ₹ en-IN
formatting. No auth — single user, no login.

## Test notes
- No credentials needed (memory/test_credentials.md).
- Empty-state "Load 3-month demo" seeds history for immediate forecast testing.
- Deleting all months returns the app to the empty state (user requested empty start).
