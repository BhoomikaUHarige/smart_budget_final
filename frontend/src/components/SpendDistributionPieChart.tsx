import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_COLORS } from "@/lib/categories";
import { tooltipStyle } from "@/lib/chart";
import { formatINR, monthLabel } from "@/lib/format";
import type { CategorySlice, Stats } from "@/types";

interface PieProps {
  stats?: Stats;
}

const ALL = "__all__";

export default function SpendDistributionPieChart({ stats }: PieProps) {
  const byMonth = stats?.categories_by_month ?? [];
  // Default to the newest closed month; "All months" aggregates every closed month.
  const [view, setView] = useState<string>("");

  const options = useMemo(() => {
    const labels: Record<string, string> = { [ALL]: "All months combined" };
    for (const m of byMonth) labels[m.month] = monthLabel(m.month);
    return labels;
  }, [byMonth]);

  const selected = view || (byMonth.length > 0 ? byMonth[byMonth.length - 1].month : ALL);

  const slices: CategorySlice[] = useMemo(() => {
    if (selected === ALL) return stats?.categories_total ?? [];
    return byMonth.find((m) => m.month === selected)?.slices ?? [];
  }, [selected, byMonth, stats]);

  const visible = slices.filter((s) => s.amount > 0);
  const total = visible.reduce((acc, s) => acc + s.amount, 0);
  const data = visible.map((s) => ({ name: s.category, value: s.amount }));

  return (
    <Card className="animate-rise transition-colors hover:border-slate-700" data-testid="chart-category-pie">
      <CardHeader>
        <CardTitle className="font-heading">Where the money went</CardTitle>
        <CardDescription>
          {selected === ALL
            ? `Category split across all ${byMonth.length} closed month${byMonth.length === 1 ? "" : "s"}`
            : `Category split of actual spend · ${monthLabel(selected)}`}
        </CardDescription>
        {byMonth.length > 0 && (
          <div className="pt-3">
            <Select value={selected} onValueChange={(v: string) => setView(v)}>
              <SelectTrigger size="sm" className="w-full sm:w-56" data-testid="select-pie-month">
                <SelectValue>{(v) => options[v as string] ?? "Select month"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} data-testid="select-pie-option-all">
                  All months combined
                </SelectItem>
                {[...byMonth].reverse().map((m) => (
                  <SelectItem key={m.month} value={m.month} data-testid={`select-pie-option-${m.month}`}>
                    {monthLabel(m.month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No category data yet — log a month&apos;s actuals with per-category amounts to light up the donut.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative h-52">
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
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</span>
                <span className="font-mono text-sm font-medium" data-testid="pie-total-spend">
                  {formatINR(total)}
                </span>
              </div>
            </div>
            <ul className="space-y-1.5" data-testid="category-legend-list">
              {visible.map((s) => (
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
