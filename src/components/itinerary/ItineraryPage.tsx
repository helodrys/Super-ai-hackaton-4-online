import { motion } from "framer-motion";
import { useState } from "react";
import { itinerary } from "../../data/itinerary";
import { pageTransition } from "../../lib/motion";
import { createMapPinsFromTripPlan } from "../../lib/plannerEngine";
import type { Coordinates, PageKey, TripPlan } from "../../types";
import { SafeFlowMapPanel } from "../SafeFlowMapPanel";
import { AIExplanationPanel } from "./AIExplanationPanel";
import { ItineraryHeader } from "./ItineraryHeader";
import { ItineraryTimeline } from "./ItineraryTimeline";

type ItineraryPageProps = {
  onNavigate: (page: PageKey) => void;
  tripPlan: TripPlan | null;
};

export function ItineraryPage({ onNavigate: _onNavigate, tripPlan }: ItineraryPageProps) {
  const plan = tripPlan ?? itinerary;
  const pins = createMapPinsFromTripPlan(plan);
  const [previewCoordinates, setPreviewCoordinates] = useState<Coordinates[]>([]);

  return (
    <motion.div className="itinerary-page" {...pageTransition}>
      <ItineraryHeader plan={plan} />
      <div className="itinerary-grid">
        <div className="itinerary-main">
          <SafeFlowMapPanel pins={pins} selectedPin={pins[0]?.id} variant="bangkok" previewCoordinates={previewCoordinates} stops={plan.stops} />
          <ItineraryTimeline plan={plan} onPreviewAlternative={setPreviewCoordinates} />
        </div>
        <aside className="itinerary-side">
          <AIExplanationPanel plan={plan} />
        </aside>
      </div>
    </motion.div>
  );
}
