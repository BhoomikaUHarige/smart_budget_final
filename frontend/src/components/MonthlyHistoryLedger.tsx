import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { apiDelete } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { formatINR, monthLabel } from "@/lib/format";
import type { Month } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LedgerProps {
  months: Month[];
  onEnterActuals: (m: Month) => void;
  onEditPlan: (m: Month) => void;
}

function StatusBadge({ m }: { m: Month }) {
  if (!m.closed) {
    return (
      <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-300" data-testid={`status-badge-${m.month}`}>
        Planned
      </Badge>
    );
  }
  if (m.actual_spend !== null && m.actual_spend > m.planned_spend) {
    return (
      <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-300" data-testid={`status-badge-${m.month}`}>
        Over budget
      </Badge>
    );
  }
  if (m.actual_save !== null && m.actual_save < m.planned_save) {
    return (
      <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300" data-testid={`status-badge-${m.month}`}>
        Saved less
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300" data-testid={`status-badge-${m.month}`}>
      On track
    </Badge>
  );
}

export default function MonthlyHistoryLedger({ months, onEnterActuals, onEditPlan }: LedgerProps) {
  const qc = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/months/${id}`),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Month deleted");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const rows = [...months].reverse(); // newest first in the ledger

  return (
    <Card className="animate-rise overflow-hidden" data-testid="table-monthly-history">
      <CardHeader>
        <CardTitle className="font-heading">Monthly history</CardTitle>
        <CardDescription>Every plan and its actuals — the rows the matrix engine learns from</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="hidden text-right md:table-cell">Income</TableHead>
              <TableHead className="text-right">Planned spend</TableHead>
              <TableHead className="text-right">Planned save</TableHead>
              <TableHead className="text-right">Actual spend</TableHead>
              <TableHead className="text-right">Actual save</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{monthLabel(m.month)}</TableCell>
                <TableCell className="hidden text-right font-mono md:table-cell">{formatINR(m.income)}</TableCell>
                <TableCell className="text-right font-mono">{formatINR(m.planned_spend)}</TableCell>
                <TableCell className="text-right font-mono">{formatINR(m.planned_save)}</TableCell>
                <TableCell className="text-right font-mono" data-testid={`cell-actual-spend-${m.month}`}>
                  {m.actual_spend === null ? "—" : formatINR(m.actual_spend)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {m.actual_save === null ? "—" : formatINR(m.actual_save)}
                </TableCell>
                <TableCell>
                  <StatusBadge m={m} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => onEnterActuals(m)}
                      data-testid={`btn-enter-actuals-${m.month}`}
                    >
                      {m.closed ? "Update actuals" : "Enter actuals"}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-xs" data-testid={`btn-month-menu-${m.month}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditPlan(m)} data-testid={`btn-edit-month-${m.month}`}>
                          <Pencil className="h-4 w-4" /> Edit plan
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(m.id)}
                          data-testid={`btn-delete-month-${m.month}`}
                        >
                          <Trash2 className="h-4 w-4" /> Delete month
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
