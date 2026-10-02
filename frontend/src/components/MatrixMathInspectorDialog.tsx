import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Forecast } from "@/types";

interface InspectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forecast?: Forecast;
}

function MatrixFigure({ title, rows }: { title: string; rows: number[][] }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
      <p className="text-[11px] uppercase tracking-wider text-sky-400/80">{title}</p>
      <table className="mt-2 w-full text-center font-mono text-xs text-slate-200">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((v, j) => (
                <td key={j} className="px-1.5 py-0.5 tabular-nums">
                  {v.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VectorFigure({ title, values, unit }: { title: string; values: number[]; unit?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
      <p className="text-[11px] uppercase tracking-wider text-sky-400/80">{title}</p>
      <p className="mt-2 font-mono text-xs leading-relaxed text-slate-200">
        [{values.map((v) => v.toFixed(2)).join(", ")}]{unit}
      </p>
    </div>
  );
}

export default function MatrixMathInspectorDialog({ open, onOpenChange, forecast: f }: InspectorProps) {
  const m = f?.matrix;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>The linear algebra behind your forecast</DialogTitle>
          <DialogDescription>
            The engine fits spend and savings over your closed months with weighted least squares, solved by the
            normal equations θ = (XᵀWX)⁻¹XᵀWy. Row i of X is [1, tᵢ] (intercept + time), W is a diagonal recency-weight
            matrix, and θ = [c, m] gives the line c + m·t projected onto next month.
          </DialogDescription>
        </DialogHeader>

        {m ? (
          <div className="space-y-4 font-mono text-xs" data-testid="matrix-equation-box">
            <p className="text-slate-400">
              labels: {m.labels.join(", ")} · n = {m.labels.length}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <MatrixFigure title="X — design matrix (n×2)" rows={m.X} />
              <VectorFigure title="y — actual spend (n×1)" values={m.y_spend} />
              <VectorFigure title="diag(W) — recency weights" values={m.weights} />
              <MatrixFigure title="XᵀWX — normal matrix (2×2)" rows={m.XtX} />
              {m.XtX_inv ? (
                <MatrixFigure title="(XᵀWX)⁻¹ — inverse" rows={m.XtX_inv} />
              ) : (
                <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-slate-400">
                  <p className="text-[11px] uppercase tracking-wider text-sky-400/80">(XᵀWX)⁻¹</p>
                  <p className="mt-2">singular — needs ≥ 2 months</p>
                </div>
              )}
              <VectorFigure title="XᵀWy — spend" values={m.Xty_spend} />
              <VectorFigure title="XᵀWy — savings" values={m.Xty_save} />
              <VectorFigure title="θ_spend = [c, m]" values={m.theta_spend} />
              <VectorFigure title="θ_save = [c, m]" values={m.theta_save} />
            </div>
            <p className="text-emerald-300">
              R² spend {m.r2_spend.toFixed(2)} · R² savings {m.r2_save.toFixed(2)} — 1.0 is a perfect line fit.
            </p>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-800 p-6 text-center text-sm text-muted-foreground">
            The engine wakes up after you close your first month. Every logged month adds a row to X.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
