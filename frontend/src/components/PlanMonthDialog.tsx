import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPatch, apiPost } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import type { Month, MonthCreate } from "@/types";
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

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Month | null;
  defaultMonth: string;
}

export default function PlanMonthDialog({ open, onOpenChange, editing, defaultMonth }: PlanDialogProps) {
  const qc = useQueryClient();
  const [month, setMonth] = useState(defaultMonth);
  const [income, setIncome] = useState("");
  const [spend, setSpend] = useState("");
  const [save, setSave] = useState("");

  useEffect(() => {
    if (open) {
      setMonth(editing ? editing.month : defaultMonth);
      setIncome(editing ? String(editing.income) : "");
      setSpend(editing ? String(editing.planned_spend) : "");
      setSave(editing ? String(editing.planned_save) : "");
    }
  }, [open, editing, defaultMonth]);

  const mutation = useMutation({
    mutationFn: (payload: MonthCreate) =>
      editing ? apiPatch<Month>(`/months/${editing.id}`, payload) : apiPost<Month>("/months", payload),
    onSuccess: (m) => {
      qc.invalidateQueries();
      toast.success(editing ? `Plan for ${m.month} updated` : `Plan for ${m.month} created`);
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const incomeNum = Number(income) || 0;
  const overCommitted = incomeNum > 0 && (Number(spend) || 0) + (Number(save) || 0) > incomeNum;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!month || income === "" || spend === "" || save === "") return;
    mutation.mutate({
      month,
      income: Number(income),
      planned_spend: Number(spend),
      planned_save: Number(save),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit month plan" : "New monthly plan"}</DialogTitle>
          <DialogDescription>
            Set the goals now — expected income, spending cap and savings target. You&apos;ll log the real numbers
            when the month closes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan-month">Month</Label>
            <Input
              id="plan-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
              data-testid="input-plan-month"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-income">Expected income (₹)</Label>
            <Input
              id="plan-income"
              type="number"
              min="0"
              step="100"
              placeholder="50000"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              required
              data-testid="input-plan-income"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="plan-spend">Planned spend (₹)</Label>
              <Input
                id="plan-spend"
                type="number"
                min="0"
                step="100"
                placeholder="35000"
                value={spend}
                onChange={(e) => setSpend(e.target.value)}
                required
                data-testid="input-plan-spend"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-save">Planned savings (₹)</Label>
              <Input
                id="plan-save"
                type="number"
                min="0"
                step="100"
                placeholder="15000"
                value={save}
                onChange={(e) => setSave(e.target.value)}
                required
                data-testid="input-plan-save"
              />
            </div>
          </div>
          {overCommitted && (
            <p className="text-xs text-amber-300" data-testid="plan-warning">
              Spend + savings exceed expected income — double-check your plan.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} data-testid="form-plan-month-submit">
              {editing ? "Save changes" : "Create plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
