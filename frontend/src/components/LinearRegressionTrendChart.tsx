import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { axisTick, gridStroke, tooltipStyle } from "@/lib/chart";
import { formatINR, formatINRCompact, monthLabel } from "@/lib/format";
import type { Forecast } from "@/types";

interface TrendProps {
  forecast?: Forecast;
}

export default function LinearRegressionTrendChart({ forecast: f }: TrendProps) {
  const series = f?.trend_series ?? [];
  const data = series.map((p) => ({
    month: p.month ? monthLabel(p.month) : "Next",
    actual: p.actual,
    fitted: p.fitted,
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
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
