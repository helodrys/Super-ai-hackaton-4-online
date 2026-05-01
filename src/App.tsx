import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import { TaxiPage } from "./components/taxi/TaxiPage";
import { PlannerPage } from "./components/planner/PlannerPage";
import { ItineraryPage } from "./components/itinerary/ItineraryPage";
import type { PageKey, TripPlan } from "./types";

export default function App() {
  const [page, setPage] = useState<PageKey>("dashboard");
  const [latestTripPlan, setLatestTripPlan] = useState<TripPlan | null>(null);

  return (
    <AppShell currentPage={page} onNavigate={setPage}>
      <AnimatePresence mode="wait">
        {page === "dashboard" && <DashboardPage key="dashboard" onNavigate={setPage} latestTripPlan={latestTripPlan} />}
        {page === "taxi" && <TaxiPage key="taxi" onNavigate={setPage} />}
        {page === "planner" && <PlannerPage key="planner" onNavigate={setPage} onTripPlanGenerated={setLatestTripPlan} />}
        {page === "itinerary" && <ItineraryPage key="itinerary" onNavigate={setPage} tripPlan={latestTripPlan} />}
      </AnimatePresence>
    </AppShell>
  );
}
