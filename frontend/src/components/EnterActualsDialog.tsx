import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPatch } from "@/lib/api";
import { CATEGORIES } from "@/lib/categories";
import { errorMessage } from "@/lib/errors";
import { formatINR, monthLabel } from "@/lib/format";
import type { Month, MonthUpdate } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ActualsDialogProps {
  month: Month | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EnterActualsDialog({ month, open, onOpenChange }: ActualsDialogProps) {
  const qc = useQueryClient();
  const [income, setIncome] = useState("");
  const [save, setSave] = useState("");
  const [cats, setCats] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && month) {
      setIncome(String(month.income));
      setSave(month.actual_save === null ? "" : String(month.actual_save));
      const initial: Record<string, string> = {};
      for (const c of CATEGORIES) initial[c] = month.categories[c] ? String(month.categories[c]) : "";
      setCats(initial);
    }
  }, [open, month]);

  const totalSpend = CATEGORIES.reduce((acc, c) => acc + (Number(cats[c]) || 0), 0);
  const incomeNum = Number(income) || 0;
  const left = incomeNum - totalSpend - (Number(save) || 0);

  const mutation = useMutation({
    mutationFn: (payload: MonthUpdate) => apiPatch<Month>(`/months/${month?.id ?? ""}`, payload),
    onSuccess: (m) => {
      qc.invalidateQueries();
      toast.success(`Actuals logged for ${m.month} — forecast refreshed`);
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!month) return;
    const categories: Record<string, number> = {};
    for (const c of CATEGORIES) {
      const v = Number(cats[c]) || 0;
      if (v > 0) categories[c] = v;
    }
    mutation.mutate({ income: incomeNum, actual_save: Number(save) || 0, categories });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log actuals — {month ? monthLabel(month.month) : ""}</DialogTitle>
          <DialogDescription>
            Enter what you really spent per category and what you really saved. Total spend is computed for you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="actual-income">Actual income (₹)</Label>
              <Input
                id="actual-income"
                type="number"
                min="0"
                step="100"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                required
                data-testid="input-actual-income"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual-save">Actually saved (₹)</Label>
              <Input
                id="actual-save"
                type="number"
                min="0"
                step="100"
                placeholder="0"
                value={save}
                onChange={(e) => setSave(e.target.value)}
                required
                data-testid="input-actual-save"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Spent by category</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {CATEGORIES.map((c) => (
                <div key={c} className="space-y-1">
                  <Label htmlFor={`cat-${c}`} className="text-xs text-muted-foreground">
                    {c}
                  </Label>
                  <Input
                    id={`cat-${c}`}
                    type="number"
                    min="0"
                    step="50"
                    placeholder="0"
                    className="h-8"
                    value={cats[c] ?? ""}
                    onChange={(e) => setCats((prev) => ({ ...prev, [c]: e.target.value }))}
                    data-testid={`input-cat-${c.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-accent px-4 py-3 text-sm">
            <span>Total actual spend</span>
            <span className="font-mono text-base font-medium" data-testid="actual-total-spend">
              {formatINR(totalSpend)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Income − spend − savings = <span className="font-mono">{formatINR(left)}</span>
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || (totalSpend === 0 && save === "")}
              data-testid="form-actuals-submit"
            >
              Save actuals
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
