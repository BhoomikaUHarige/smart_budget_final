// Shared "last N months" range filter used by the bar and trend charts.
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type RangeKey = "all" | "3" | "6" | "12";

export const RANGE_LABELS: Record<RangeKey, string> = {
  all: "All",
  "3": "Last 3",
  "6": "Last 6",
  "12": "Last 12",
};

/** Keep the trailing slice of a chronological series. */
export function applyRange<T>(items: T[], range: RangeKey): T[] {
  if (range === "all") return items;
  const n = Number(range);
  return items.length > n ? items.slice(items.length - n) : items;
}

interface ChartRangeTabsProps {
  value: RangeKey;
  onChange: (value: RangeKey) => void;
  testId: string;
  available: number; // how many months exist — larger ranges stay hidden until useful
}

export default function ChartRangeTabs({ value, onChange, testId, available }: ChartRangeTabsProps) {
  const keys: RangeKey[] = ["all", "3", "6", "12"];
  const shown = keys.filter((k) => k === "all" || Number(k) < available);
  if (shown.length <= 1) return null;

  return (
    <Tabs value={value} onValueChange={(v: string) => onChange(v as RangeKey)}>
      <TabsList variant="line" data-testid={testId}>
        {shown.map((k) => (
          <TabsTrigger key={k} value={k} data-testid={`${testId}-${k}`}>
            {RANGE_LABELS[k]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
