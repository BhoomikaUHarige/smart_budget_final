import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Sigma, Upload } from "lucide-react";
import { apiPost } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { Month } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  onCreateFirst: () => void;
}

export default function EmptyStateEmptyApp({ onCreateFirst }: EmptyStateProps) {
  const qc = useQueryClient();
  const demo = useMutation({
    mutationFn: () => apiPost<Month[]>("/months/demo"),
    onSuccess: (created) => {
      qc.invalidateQueries();
      toast.success(
        created.length === 0
          ? "Demo months already present"
          : `${created.length} demo months loaded — the matrix engine is live`,
      );
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Card className="animate-rise" data-testid="empty-state">
      <CardContent className="flex flex-col items-center gap-6 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sigma className="h-7 w-7" />
        </div>
        <div className="max-w-xl space-y-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">Start with your first monthly plan</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            1 — <span className="text-slate-300">Plan:</span> set income, spending cap and savings target at the
            start of the month.
            <br />
            2 — <span className="text-slate-300">Log:</span> when the month closes, enter what you really spent and
            saved.
            <br />
            3 — <span className="text-slate-300">Forecast:</span> θ = (XᵀWX)⁻¹XᵀWy turns your history into next
            month&apos;s budget.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onCreateFirst} data-testid="btn-create-first-plan">
            <Plus className="h-4 w-4" /> Create first month plan
          </Button>
          <Button variant="outline" onClick={() => demo.mutate()} disabled={demo.isPending} data-testid="btn-load-demo">
            <Upload className="h-4 w-4" /> Load 3-month demo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
