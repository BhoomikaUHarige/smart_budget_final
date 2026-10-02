import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_COLORS } from "@/lib/categories";
import { tooltipStyle } from "@/lib/chart";
import { formatINR, monthLabel } from "@/lib/format";
import type { Stats } from "@/types";

interface PieProps {
  stats?: Stats;
}

export default function SpendDistributionPieChart({ stats }: PieProps) {
  const slices = (stats?.categories_last ?? []).filter((s) => s.amount > 0);
  const total = slices.reduce((acc, s) => acc + s.amount, 0);
  const data = slices.map((s) => ({ name: s.category, value: s.amount }));

  return (
    <Card className="animate-rise transition-colors hover:border-slate-700" data-testid="chart-category-pie">
      <CardHeader>
        <CardTitle className="font-heading">Where the money went</CardTitle>
        <CardDescription>
          {stats?.last_closed_month
            ? `Category split of actual spend · ${monthLabel(stats.last_closed_month)}`
            : "Category split of actual spend"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No category data yet — log a month&apos;s actuals with per-category amounts to light up the donut.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} strokeWidth={0}>
                    {data.map((d) => (
                      <Cell key={d.name} fill={CATEGORY_COLORS[d.name] ?? "#94A3B8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [formatINR(Number(value), true), String(name)]}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1.5" data-testid="category-legend-list">
              {slices.map((s) => (
                <li key={s.category} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLORS[s.category] ?? "#94A3B8" }} />
                    {s.category}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {formatINR(s.amount)} · {total > 0 ? Math.round((s.amount / total) * 100) : 0}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
