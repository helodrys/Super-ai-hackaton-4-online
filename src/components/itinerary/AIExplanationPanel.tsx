import { Sparkles } from "lucide-react";
import type { TripPlan } from "../../types";

type AIExplanationPanelProps = {
  plan: TripPlan;
};

export function AIExplanationPanel({ plan }: AIExplanationPanelProps) {
  const bestStops = [...plan.stops].sort((a, b) => b.score - a.score).slice(0, 3);

  return (
    <section className="ai-panel">
      <span className="panel-label"><Sparkles size={15} /> Why this route</span>
      <h2>{plan.source === "typhoon" ? "Typhoon produced this plan from allowed local IDs." : "Deterministic local fallback produced this plan."}</h2>
      <p>{plan.summary}</p>
      <ul>
        {bestStops.map((stop) => (
          <li key={stop.placeId}>{stop.name}: {stop.vibeMatch}</li>
        ))}
      </ul>
      {plan.setupMessage && <p className="setup-message">{plan.setupMessage}</p>}
    </section>
  );
}
