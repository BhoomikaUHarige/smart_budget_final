// Fixed spending categories — mirrored from backend/models/month.py CATEGORIES. Keep in sync.

export const CATEGORIES = [
  "Housing",
  "Groceries",
  "Transport",
  "Utilities",
  "Entertainment",
  "Health",
  "Shopping",
  "Other",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Housing: "#38BDF8",
  Groceries: "#34D399",
  Transport: "#FBBF24",
  Utilities: "#A78BFA",
  Entertainment: "#F472B6",
  Health: "#FB7185",
  Shopping: "#FB923C",
  Other: "#94A3B8",
};
