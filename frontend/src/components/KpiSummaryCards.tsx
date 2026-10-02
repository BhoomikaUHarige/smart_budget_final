import { Landmark, Percent, Target, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR, monthLabel } from "@/lib/format";
import type { Forecast, Stats } from "@/types";

interface KpiSummaryCardsProps {
  stats?: Stats;
  forecast?: Forecast;
}

export default function KpiSummaryCards({ stats, forecast }: KpiSummaryCardsProps) {
  const latest = stats && stats.months.length > 0 ? stats.months[stats.months.length - 1] : undefined;
  const latestOver = latest && latest.actual_spend !== null && latest.actual_spend > latest.planned_spend;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      <Card className="animate-rise transition-colors hover:border-slate-700" data-testid="kpi-total-savings">
        <CardContent className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total savings</p>
            <p className="mt-2 font-mono text-2xl font-medium tracking-tight">{formatINR(stats?.total_saved)}</p>
            <p className="mt-1 text-xs text-muted-foreground">across {stats?.closed_months ?? 0} closed month{(stats?.closed_months ?? 0) === 1 ? "" : "s"}</p>
          </div>
          <div className="rounded-lg bg-accent p-2">
            <Landmark className="h-4 w-4 text-emerald-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="animate-rise transition-colors hover:border-slate-700" data-testid="kpi-current-spend">
        <CardContent className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Latest month spend</p>
            <p className="mt-2 font-mono text-2xl font-medium tracking-tight">
              {formatINR(latest ? (latest.actual_spend ?? latest.planned_spend) : null)}
            </p>
            <p className={`mt-1 text-xs ${latestOver ? "text-amber-300" : "text-muted-foreground"}`}>
              {latest
                ? latest.actual_spend === null
                  ? `plan ${formatINR(latest.planned_spend)} · awaiting actuals`
                  : `plan ${formatINR(latest.planned_spend)} · ${latestOver ? "over" : "within"} budget`
                : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-accent p-2">
            <Target className="h-4 w-4 text-sky-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="animate-rise transition-colors hover:border-slate-700" data-testid="kpi-savings-rate">
        <CardContent className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Savings rate</p>
            <p className="mt-2 font-mono text-2xl font-medium tracking-tight">
              {stats?.savings_rate !== null && stats?.savings_rate !== undefined ? `${stats.savings_rate}%` : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">of closed-month income</p>
          </div>
          <div className="rounded-lg bg-accent p-2">
            <Percent className="h-4 w-4 text-indigo-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="animate-rise transition-colors hover:border-slate-700" data-testid="kpi-forecast-next">
        <CardContent className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Next-month spend ceiling</p>
            <p className="mt-2 font-mono text-2xl font-medium tracking-tight">{formatINR(forecast?.recommended_spend)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {forecast?.target_month ? `engine forecast · ${monthLabel(forecast.target_month)}` : "engine standby"}
            </p>
          </div>
          <div className="rounded-lg bg-accent p-2">
            <TrendingUp className="h-4 w-4 text-violet-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
