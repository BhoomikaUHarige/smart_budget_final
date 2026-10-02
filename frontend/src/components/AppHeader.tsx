import { IndianRupee, Plus, Sigma } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  onNewPlan: () => void;
  onInspectMath: () => void;
}

export default function AppHeader({ onNewPlan, onInspectMath }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sigma className="h-5 w-5" />
          </div>
          <div>
            <p className="font-heading text-base font-semibold leading-none tracking-tight" data-testid="brand-logo">
              SmartBudget Matrix
            </p>
            <p className="mt-1 text-xs text-muted-foreground">plan · log · forecast</p>
          </div>
          <Badge variant="outline" className="ml-2 hidden gap-1 border-slate-700 text-muted-foreground sm:inline-flex">
            <IndianRupee className="h-3 w-3" /> INR
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onInspectMath} data-testid="btn-inspect-math">
            <Sigma className="h-4 w-4" /> Inspect math
          </Button>
          <Button size="sm" onClick={onNewPlan} data-testid="btn-new-plan">
            <Plus className="h-4 w-4" /> New monthly plan
          </Button>
        </div>
      </div>
    </header>
  );
}
