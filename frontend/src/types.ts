// Hand-written mirrors of the backend Pydantic models (backend/models/*) — nothing infers
// across the Python/TS boundary, so keep every interface in sync with its model.

export interface Month {
  id: string;
  month: string; // "YYYY-MM"
  income: number;
  planned_spend: number;
  planned_save: number;
  actual_spend: number | null;
  actual_save: number | null;
  categories: Record<string, number>;
  closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonthCreate {
  month: string;
  income: number;
  planned_spend: number;
  planned_save: number;
}

export interface MonthUpdate {
  month?: string;
  income?: number;
  planned_spend?: number;
  planned_save?: number;
  actual_spend?: number;
  actual_save?: number;
  categories?: Record<string, number>;
}

export interface SeriesFit {
  slope: number;
  intercept: number;
  r2: number;
}

export interface TrendPoint {
  month: string | null;
  t: number;
  actual: number | null;
  fitted: number;
  projected: boolean;
}

export interface MatrixBreakdown {
  labels: string[];
  weights: number[];
  X: number[][];
  y_spend: number[];
  y_save: number[];
  XtX: number[][];
  XtX_inv: number[][] | null;
  Xty_spend: number[];
  Xty_save: number[];
  theta_spend: number[]; // [intercept, slope]
  theta_save: number[]; // [intercept, slope]
  r2_spend: number;
  r2_save: number;
}

export interface Forecast {
  target_month: string | null;
  has_history: boolean;
  months_used: number;
  income_next: number | null;
  recommended_spend: number | null;
  recommended_save: number | null;
  trend_spend: number | null;
  trend_save: number | null;
  spend_fit: SeriesFit | null;
  save_fit: SeriesFit | null;
  plan_gap_spend: number | null;
  base_plan_spend: number | null;
  base_plan_save: number | null;
  vs_plan_spend: number | null;
  vs_plan_save: number | null;
  trend_series: TrendPoint[];
  matrix: MatrixBreakdown | null;
  notes: string[];
  method: string;
}

export interface MonthSeriesPoint {
  month: string;
  planned_spend: number;
  actual_spend: number | null;
  planned_save: number;
  actual_save: number | null;
}

export interface CategorySlice {
  category: string;
  amount: number;
}

export interface Stats {
  months: MonthSeriesPoint[];
  categories_total: CategorySlice[];
  categories_last: CategorySlice[] | null;
  last_closed_month: string | null;
  total_saved: number;
  total_closed_income: number;
  avg_spend: number | null;
  savings_rate: number | null;
  months_tracked: number;
  closed_months: number;
}
