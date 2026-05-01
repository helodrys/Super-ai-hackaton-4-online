import { CalendarClock, MapPinned, WalletCards } from "lucide-react";
import type { TripPlan } from "../../types";

type ItineraryHeaderProps = {
  plan: TripPlan;
};

export function ItineraryHeader({ plan }: ItineraryHeaderProps) {
  return (
    <section className="itinerary-header">
      <div>
        <span className="eyebrow"><MapPinned size={15} /> {plan.city} personal route</span>
        <h1>{plan.title}</h1>
        <p>{plan.summary}</p>
        <span className={plan.source === "typhoon" ? "route-source route-source-typhoon" : "route-source"}>
          {plan.source === "typhoon" ? "Typhoon grounded result" : "Local fallback result"}
        </span>
      </div>
      <div className="route-stat-row">
        <span><CalendarClock size={17} /> {plan.duration}</span>
        <span><WalletCards size={17} /> {plan.estimatedBudget.toLocaleString()} THB</span>
        <span>{plan.walkingLoad} walking</span>
      </div>
    </section>
  );
}
