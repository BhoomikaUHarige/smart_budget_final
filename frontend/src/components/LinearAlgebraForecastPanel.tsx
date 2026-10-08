import { ArrowDownRight, ArrowUpRight, Minus, Sigma } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR, formatSignedINR, monthLabel } from "@/lib/format";
import type { Forecast } from "@/types";

interface PanelProps {
  forecast?: Forecast;
  onInspectMath: () => void;
}

const BADGE: Record<string, { label: string; className: string }> = {
  standby: { label: "Standby", className: "border-slate-600 bg-slate-800/60 text-slate-300" },
  deficit: { label: "Deficit throttle", className: "border-amber-500/50 bg-amber-500/10 text-amber-300" },
  surplus: { label: "Surplus unlocked", className: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" },
  steady: { label: "On plan", className: "border-sky-500/50 bg-sky-500/10 text-sky-300" },
};

function Delta({ value, goodWhenNegative, testId }: { value: number | null | undefined; goodWhenNegative: boolean; testId: string }) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-muted-foreground">no plan for this month yet</span>;
  }
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-sky-300" data-testid={testId}>
        <Minus className="h-3 w-3" /> exactly on your plan
      </span>
    );
  }
  const good = goodWhenNegative ? value < 0 : value > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${good ? "text-emerald-300" : "text-amber-300"}`}
      data-testid={testId}
    >
      {value > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {formatSignedINR(value, true)} vs your plan
    </span>
  );
}

export default function LinearAlgebraForecastPanel({ forecast: f, onInspectMath }: PanelProps) {
  const gap = f?.plan_gap_spend ?? null;
  const status = !f ? "standby" : !f.has_history ? "standby" : gap === null ? "steady" : gap > 0.5 ? "deficit" : gap < -0.5 ? "surplus" : "steady";
  const badge = BADGE[status];

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <Card className="animate-rise relative overflow-hidden lg:col-span-7" data-testid="forecast-panel">
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Engine forecast</p>
              <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight" data-testid="forecast-target-month">
                {f?.target_month ? monthLabel(f.target_month) : "—"}
              </h2>
            </div>
            <Badge variant="outline" className={badge.className} data-testid="forecast-badge-status">
              {badge.label}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-accent p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recommended spend</p>
              <p className="mt-1 font-mono text-2xl font-medium tracking-tight" data-testid="forecast-next-spend">
                {formatINR(f?.recommended_spend)}
              </p>
              <p className="mt-1">
                <Delta value={f?.vs_plan_spend} goodWhenNegative testId="forecast-delta-spend" />
              </p>
            </div>
            <div className="rounded-lg border border-border bg-accent p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recommended savings</p>
              <p className="mt-1 font-mono text-2xl font-medium tracking-tight" data-testid="forecast-next-save">
                {formatINR(f?.recommended_save)}
              </p>
              <p className="mt-1">
                <Delta value={f?.vs_plan_save} goodWhenNegative={false} testId="forecast-delta-save" />
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Projected income: <span className="font-mono text-slate-300">{formatINR(f?.income_next)}</span>
            {f?.trend_spend !== null && f?.trend_spend !== undefined && (
              <> · raw WLS spend projection: <span className="font-mono text-slate-300">{formatINR(f.trend_spend)}</span></>
            )}
          </p>

          <ul className="space-y-2 border-t border-border pt-4">
            {(f?.notes ?? []).map((note, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-sky-400" />
                {note}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="animate-rise overflow-hidden border-border/70 bg-[#060A11] lg:col-span-5" data-testid="matrix-engine-card">
        <CardContent className="space-y-4 font-mono">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-sky-400/80">Matrix engine</p>
            <Sigma className="h-4 w-4 text-sky-400" />
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-xs leading-relaxed text-sky-300" data-testid="matrix-equation-box">
            <p>θ = (XᵀWX)⁻¹ Xᵀ W y</p>
            {f?.has_history && f.spend_fit ? (
              <>
                <p className="mt-2 text-slate-400">X ∈ ℝ^{f.months_used}×2 · y ∈ ℝ^{f.months_used} · W = diag(w)</p>
                <p className="mt-1">θ_spend = [{f.spend_fit.intercept.toFixed(2)}, {f.spend_fit.slope.toFixed(2)}]</p>
                <p className="mt-1">θ_save = [{f.save_fit?.intercept.toFixed(2)}, {f.save_fit?.slope.toFixed(2)}]</p>
                <p className="mt-1 text-emerald-300">R² spend {f.spend_fit.r2.toFixed(2)} · save {f.save_fit?.r2.toFixed(2)}</p>
              </>
            ) : (
              <p className="mt-2 text-slate-400">awaiting first closed month…</p>
            )}
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={onInspectMath} data-testid="btn-open-matrix-inspector">
            Open full inspector
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
