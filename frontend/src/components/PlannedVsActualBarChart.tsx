import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChartRangeTabs, { applyRange, type RangeKey } from "@/components/ChartRangeTabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { axisTick, gridStroke, tooltipStyle } from "@/lib/chart";
import { formatINR, formatINRCompact, monthLabel } from "@/lib/format";
import type { Stats } from "@/types";

interface BarProps {
  stats?: Stats;
}

export default function PlannedVsActualBarChart({ stats }: BarProps) {
  const [range, setRange] = useState<RangeKey>("all");
  const [showSavings, setShowSavings] = useState(true);

  const all = stats?.months ?? [];
  const data = applyRange(all, range).map((p) => ({
    month: monthLabel(p.month),
    "Planned spend": p.planned_spend,
    "Actual spend": p.actual_spend,
    "Planned save": p.planned_save,
    "Actual save": p.actual_save,
  }));

  return (
    <Card className="animate-rise transition-colors hover:border-slate-700" data-testid="chart-planned-actual-bar">
      <CardHeader>
        <CardTitle className="font-heading">Plan vs reality</CardTitle>
        <CardDescription>Planned and actual spend &amp; savings, month by month</CardDescription>
        {all.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <ChartRangeTabs value={range} onChange={setRange} testId="range-bar" available={all.length} />
            <div className="flex items-center gap-2">
              <Checkbox
                id="bar-show-savings"
                checked={showSavings}
                onCheckedChange={(checked) => setShowSavings(checked === true)}
                data-testid="toggle-bar-savings"
              />
              <Label htmlFor="bar-show-savings" className="text-xs text-muted-foreground">
                Show savings bars
              </Label>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Create a monthly plan and the comparison appears here.
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => formatINRCompact(v)} />
                <Tooltip
                  formatter={(value: number, name: string) => [formatINR(Number(value), true), String(name)]}
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "#1F2937", opacity: 0.4 }}
                />
                <Legend formatter={(value) => <span style={{ color: "#94A3B8", fontSize: 12 }}>{String(value)}</span>} />
                <Bar dataKey="Planned spend" fill="#0EA5E9" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Actual spend" fill="#10B981" radius={[3, 3, 0, 0]} />
                {showSavings && <Bar dataKey="Planned save" fill="#818CF8" radius={[3, 3, 0, 0]} />}
                {showSavings && <Bar dataKey="Actual save" fill="#34D399" radius={[3, 3, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
