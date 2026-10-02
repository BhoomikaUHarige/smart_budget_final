import { ApiError } from "@/lib/api";

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const detail = (err.body as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) return "Please check the form values and try again.";
    return `Request failed (${err.status})`;
  }
  return err instanceof Error ? err.message : "Something went wrong";
}
