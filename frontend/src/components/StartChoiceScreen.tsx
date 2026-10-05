import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, History, RotateCcw, Sigma, TriangleAlert } from "lucide-react";
import { apiDelete } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { formatINR, monthLabel } from "@/lib/format";
import type { Month, ResetResult, Stats } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StartChoiceScreenProps {
  months: Month[];
  stats?: Stats;
  onContinue: () => void;
  onFreshStart: () => void;
}

export default function StartChoiceScreen({ months, stats, onContinue, onFreshStart }: StartChoiceScreenProps) {
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const latest = months.length > 0 ? months[months.length - 1] : undefined;
  const closed = stats?.closed_months ?? months.filter((m) => m.closed).length;

  const reset = useMutation({
    mutationFn: () => apiDelete<ResetResult>("/months"),
    onSuccess: (res) => {
      qc.invalidateQueries();
      setConfirmOpen(false);
      toast.success(
        res.deleted === 0 ? "Nothing to clear — starting fresh" : `Cleared ${res.deleted} month${res.deleted === 1 ? "" : "s"} — starting fresh`,
      );
      onFreshStart();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10" data-testid="start-choice-screen">
      <div className="w-full max-w-3xl space-y-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sigma className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back</h1>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
            You have saved budget history. Pick up where you left off, or wipe everything and begin a brand-new
            planning cycle.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Option 1 — continue */}
          <Card className="animate-rise group transition-colors hover:border-sky-600/60" data-testid="card-continue">
            <CardContent className="flex h-full flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-accent p-2">
                  <History className="h-5 w-5 text-sky-400" />
                </div>
                <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-300">
                  Recommended
                </Badge>
              </div>
              <div className="space-y-1">
                <h2 className="font-heading text-lg font-semibold tracking-tight">Continue previous plans</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Keep your history and forecasts exactly as they were.
                </p>
              </div>
              <dl className="space-y-1.5 rounded-lg border border-border bg-accent/60 p-3 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Months saved</dt>
                  <dd className="font-mono" data-testid="continue-months-count">
                    {months.length}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Closed months</dt>
                  <dd className="font-mono">{closed}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Latest month</dt>
                  <dd className="font-mono">{latest ? monthLabel(latest.month) : "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Total saved</dt>
                  <dd className="font-mono text-emerald-300">{formatINR(stats?.total_saved)}</dd>
                </div>
              </dl>
              <Button className="mt-auto w-full" onClick={onContinue} data-testid="btn-continue-plans">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Option 2 — start fresh */}
          <Card className="animate-rise transition-colors hover:border-amber-600/50" data-testid="card-start-fresh">
            <CardContent className="flex h-full flex-col gap-4">
              <div className="rounded-lg bg-accent p-2 self-start">
                <RotateCcw className="h-5 w-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h2 className="font-heading text-lg font-semibold tracking-tight">Start freshly</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Delete every saved month and begin from an empty slate — new plans, new forecast, clean charts.
                </p>
              </div>
              <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-200">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                This permanently removes all {months.length} saved month{months.length === 1 ? "" : "s"} and their
                actuals. It cannot be undone.
              </p>
              <Button
                variant="outline"
                className="mt-auto w-full"
                onClick={() => setConfirmOpen(true)}
                data-testid="btn-start-fresh"
              >
                Start fresh
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete all saved months?</DialogTitle>
            <DialogDescription>
              All {months.length} month{months.length === 1 ? "" : "s"}, their category breakdowns and the forecast
              history will be erased. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} data-testid="btn-cancel-reset">
              Keep my data
            </Button>
            <Button
              variant="destructive"
              onClick={() => reset.mutate()}
              disabled={reset.isPending}
              data-testid="btn-confirm-reset"
            >
              {reset.isPending ? "Clearing…" : "Yes, delete everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
