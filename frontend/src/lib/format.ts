// INR + month formatting helpers, shared by cards, charts and the ledger.

const inr0 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const inr2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const inrCompact = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatINR(value: number | null | undefined, decimals = false): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return decimals ? inr2.format(value) : inr0.format(value);
}

export function formatINRCompact(value: number): string {
  return `₹${inrCompact.format(value)}`;
}

export function formatSignedINR(value: number, decimals = false): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatINR(Math.abs(value), decimals)}`;
}

export function monthLabel(month: string | null | undefined): string {
  if (!month) return "—";
  const [y, m] = month.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return month;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Form default only — the authoritative month key is what the user picks / server validates.
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function nextMonthAfter(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const idx = y * 12 + m; // 1-based index of the month after `month`
  return `${String(Math.floor((idx - 1) / 12)).padStart(4, "0")}-${String(((idx - 1) % 12) + 1).padStart(2, "0")}`;
}
