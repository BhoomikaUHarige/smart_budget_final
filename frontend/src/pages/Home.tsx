import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { currentMonth, nextMonthAfter } from "@/lib/format";
import type { Forecast, Month, Stats } from "@/types";
import AppHeader from "@/components/AppHeader";
import KpiSummaryCards from "@/components/KpiSummaryCards";
import LinearAlgebraForecastPanel from "@/components/LinearAlgebraForecastPanel";
import SpendDistributionPieChart from "@/components/SpendDistributionPieChart";
import PlannedVsActualBarChart from "@/components/PlannedVsActualBarChart";
import LinearRegressionTrendChart from "@/components/LinearRegressionTrendChart";
import MonthlyHistoryLedger from "@/components/MonthlyHistoryLedger";
import PlanMonthDialog from "@/components/PlanMonthDialog";
import EnterActualsDialog from "@/components/EnterActualsDialog";
import MatrixMathInspectorDialog from "@/components/MatrixMathInspectorDialog";
import EmptyStateEmptyApp from "@/components/EmptyStateEmptyApp";
import StartChoiceScreen from "@/components/StartChoiceScreen";

export default function Home() {
  const monthsQ = useQuery({ queryKey: ["months"], queryFn: () => apiGet<Month[]>("/months") });
  const forecastQ = useQuery({ queryKey: ["forecast"], queryFn: () => apiGet<Forecast>("/forecast") });
  const statsQ = useQuery({ queryKey: ["stats"], queryFn: () => apiGet<Stats>("/stats") });

  const [planOpen, setPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Month | null>(null);
  const [actualsMonth, setActualsMonth] = useState<Month | null>(null);
  const [mathOpen, setMathOpen] = useState(false);
  // null = the launch choice hasn't been made yet this visit (asked on every app open).
  const [launchChoice, setLaunchChoice] = useState<"continue" | "fresh" | null>(null);

  const months = monthsQ.data ?? [];

  // New-plan form defaults to the month after the latest tracked one.
  const defaultMonth = useMemo(() => {
    if (months.length === 0) return currentMonth();
    return nextMonthAfter(months[months.length - 1].month);
  }, [months]);

  const openNewPlan = () => {
    setEditingPlan(null);
    setPlanOpen(true);
  };

  const openEditPlan = (m: Month) => {
    setEditingPlan(m);
    setPlanOpen(true);
  };

  const empty = !monthsQ.isLoading && months.length === 0;
  // Nothing saved yet → no point asking; go straight in.
  const showLaunchChoice = !monthsQ.isLoading && months.length > 0 && launchChoice === null;

  if (monthsQ.isLoading) {
    return (
      <div className="min-h-svh bg-background text-foreground">
        <AppHeader onNewPlan={openNewPlan} onInspectMath={() => setMathOpen(true)} />
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8" data-testid="dashboard-loading">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
        </main>
      </div>
    );
  }

  if (showLaunchChoice) {
    return (
      <div className="min-h-svh bg-background text-foreground">
        <StartChoiceScreen
          months={months}
          stats={statsQ.data}
          onContinue={() => setLaunchChoice("continue")}
          onFreshStart={() => setLaunchChoice("fresh")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <AppHeader onNewPlan={openNewPlan} onInspectMath={() => setMathOpen(true)} />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8" data-testid="page-dashboard">
        <section className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Your money, projected.</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Set a plan at the start of the month, log the real numbers at the end, and the least-squares matrix
            engine estimates what next month should look like.
          </p>
          {months.length > 0 && (
            <p className="pt-1 text-xs text-muted-foreground" data-testid="tracking-summary">
              {months.length} month{months.length === 1 ? "" : "s"} planned · {statsQ.data?.closed_months ?? 0} closed
            </p>
          )}
        </section>

        {empty ? (
          <>
            {monthsQ.isError && (
              <p className="text-sm text-amber-300" data-testid="api-offline-note">
                Can&apos;t reach the budget engine right now — check your connection and retry.
              </p>
            )}
            <EmptyStateEmptyApp onCreateFirst={openNewPlan} />
          </>
        ) : (
          <>
            <KpiSummaryCards stats={statsQ.data} forecast={forecastQ.data} />

            <LinearAlgebraForecastPanel forecast={forecastQ.data} onInspectMath={() => setMathOpen(true)} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <SpendDistributionPieChart stats={statsQ.data} />
              </div>
              <div className="lg:col-span-7">
                <PlannedVsActualBarChart stats={statsQ.data} />
              </div>
              <div className="lg:col-span-12">
                <LinearRegressionTrendChart forecast={forecastQ.data} stats={statsQ.data} />
              </div>
              <div className="lg:col-span-12">
                <MonthlyHistoryLedger months={months} onEnterActuals={setActualsMonth} onEditPlan={openEditPlan} />
              </div>
            </div>
          </>
        )}
      </main>

      <PlanMonthDialog open={planOpen} onOpenChange={setPlanOpen} editing={editingPlan} defaultMonth={defaultMonth} />
      <EnterActualsDialog
        month={actualsMonth}
        open={actualsMonth !== null}
        onOpenChange={(o) => {
          if (!o) setActualsMonth(null);
        }}
      />
      <MatrixMathInspectorDialog open={mathOpen} onOpenChange={setMathOpen} forecast={forecastQ.data} />
    </div>
  );
}
