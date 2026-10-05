import { useState } from "react";
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChartRangeTabs, { applyRange, type RangeKey } from "@/components/ChartRangeTabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { axisTick, gridStroke, tooltipStyle } from "@/lib/chart";
import { formatINR, formatINRCompact, monthLabel } from "@/lib/format";
import type { Forecast, Stats } from "@/types";

interface TrendProps {
  forecast?: Forecast;
  stats?: Stats;
}

export default function LinearRegressionTrendChart({ forecast: f, stats }: TrendProps) {
  const [range, setRange] = useState<RangeKey>("all");
  const [showSavings, setShowSavings] = useState(false);

  // Actual savings per closed month, keyed for a secondary line on the same axis.
  const saveByMonth = new Map<string, number>();
  for (const m of stats?.months ?? []) {
    if (m.actual_save !== null) saveByMonth.set(m.month, m.actual_save);
  }

  const series = f?.trend_series ?? [];
  // Keep the projected point visible regardless of range — it's the whole point of the chart.
  const history = series.filter((p) => !p.projected);
  const projected = series.filter((p) => p.projected);
  const windowed = [...applyRange(history, range), ...projected];

  const data = windowed.map((p) => ({
    month: p.month ? monthLabel(p.month) : "Next",
    actual: p.actual,
    fitted: p.fitted,
    saved: p.month ? (saveByMonth.get(p.month) ?? null) : null,
  }));

  return (
    <Card className="animate-rise transition-colors hover:border-slate-700" data-testid="chart-regression-trend">
      <CardHeader>
        <CardTitle className="font-heading">Spend trend &amp; least-squares projection</CardTitle>
        <CardDescription>
          {series.length > 0
            ? "Solid = actual spend · dashed = OLS fit c + m·t, projected into next month"
            : "The regression line activates after your first closed month"}
        </CardDescription>
        {history.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <ChartRangeTabs value={range} onChange={setRange} testId="range-trend" available={history.length} />
            <div className="flex items-center gap-2">
              <Checkbox
                id="trend-show-savings"
                checked={showSavings}
                onCheckedChange={(checked) => setShowSavings(checked === true)}
                data-testid="toggle-trend-savings"
              />
              <Label htmlFor="trend-show-savings" className="text-xs text-muted-foreground">
                Overlay actual savings
              </Label>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Log one month of actuals and θ = (XᵀWX)⁻¹XᵀWy draws your trend line here.
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => formatINRCompact(v)} />
                <Tooltip
                  formatter={(value: number, name: string) => [formatINR(Number(value), true), String(name)]}
                  contentStyle={tooltipStyle}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual spend"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#38BDF8", strokeWidth: 0 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="fitted"
                  name="OLS fit + projection"
                  stroke="#818CF8"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={{ r: 3, fill: "#818CF8", strokeWidth: 0 }}
                />
                {showSavings && (
                  <Line
                    type="monotone"
                    dataKey="saved"
                    name="Actual savings"
                    stroke="#34D399"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#34D399", strokeWidth: 0 }}
                    connectNulls={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
