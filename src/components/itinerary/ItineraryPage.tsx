import { motion } from "framer-motion";
import { useState } from "react";
import { pageTransition } from "../../lib/motion";
import { createMapPinsFromTripPlan } from "../../lib/plannerEngine";
import type { Coordinates, PageKey, TripPlan } from "../../types";
import { ThaiTAIMapPanel } from "../ThaiTAIMapPanel";
import { AIExplanationPanel } from "./AIExplanationPanel";
import { ItineraryHeader } from "./ItineraryHeader";
import { ItineraryTimeline } from "./ItineraryTimeline";

type ItineraryPageProps = {
  onNavigate: (page: PageKey) => void;
  tripPlan: TripPlan | null;
};

export function ItineraryPage({ onNavigate, tripPlan }: ItineraryPageProps) {
  const [previewCoordinates, setPreviewCoordinates] = useState<Coordinates[]>([]);

  if (!tripPlan) {
    return (
      <motion.div className="itinerary-page" {...pageTransition}>
        <section className="empty-itinerary-page">
          <span className="panel-label">My route</span>
          <h1>No trip plan yet</h1>
          <p>Create a route from the planner first. ThaiTAI keeps one generated trip in the current browser session, then shows it here.</p>
          <button className="primary-pill" onClick={() => onNavigate("planner")}>Plan a trip</button>
        </section>
      </motion.div>
    );
  }

  const pins = createMapPinsFromTripPlan(tripPlan);

  return (
    <motion.div className="itinerary-page" {...pageTransition}>
      <ItineraryHeader plan={tripPlan} />
      <div className="itinerary-grid">
        <div className="itinerary-main">
          <ThaiTAIMapPanel pins={pins} selectedPin={pins[0]?.id} variant="bangkok" previewCoordinates={previewCoordinates} stops={tripPlan.stops} />
          <ItineraryTimeline plan={tripPlan} onPreviewAlternative={setPreviewCoordinates} />
        </div>
        <aside className="itinerary-side">
          <AIExplanationPanel plan={tripPlan} />
        </aside>
      </div>
    </motion.div>
  );
}
