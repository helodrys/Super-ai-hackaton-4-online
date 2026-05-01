import { useState } from "react";
import { buildAlternativeSuggestions } from "../../lib/alternativeSuggestions";
import type { AlternativeSuggestion, Coordinates, TripPlan } from "../../types";

type AlternativeRouteTabsProps = {
  plan: TripPlan;
  onPreviewAlternative?: (coordinates: Coordinates[]) => void;
};

export function AlternativeRouteTabs({ plan, onPreviewAlternative }: AlternativeRouteTabsProps) {
  const suggestions = buildAlternativeSuggestions(plan);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = suggestions.find((suggestion) => suggestion.id === activeId);

  return (
    <section className="route-tabs alternative-sheet">
      <div className="alternative-sheet-heading">
        <span className="panel-label">Route alternatives</span>
        <h2>Keep the main route, preview smarter swaps.</h2>
      </div>
      <div className="alternative-toggle-list" aria-label="Alternative route recommendations">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            className={activeId === suggestion.id ? "alternative-toggle alternative-toggle-active" : "alternative-toggle"}
            onClick={() => toggleSuggestion(suggestion)}
            aria-expanded={activeId === suggestion.id}
          >
            <span>{suggestion.trigger}</span>
            <strong>{suggestion.title}</strong>
            <em>{suggestion.score}/100 fit</em>
          </button>
        ))}
      </div>

      {active && (
        <div className="alternative-detail">
          <div>
            <span className="panel-label">Preview only</span>
            <h3>{active.candidateName}</h3>
            <p>{active.reason}</p>
          </div>
          <div className="alternative-detail-meta">
            <strong>{active.candidateType}</strong>
            <small>+{active.routeDeltaMinutes} min estimate</small>
          </div>
          <div className="alternative-tag-row">
            {active.comfortTags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
      )}
    </section>
  );

  async function toggleSuggestion(suggestion: AlternativeSuggestion) {
    if (activeId === suggestion.id) {
      setActiveId(null);
      onPreviewAlternative?.([]);
      return;
    }

    setActiveId(suggestion.id);
    const stop = plan.stops.find((item) => item.placeId === suggestion.replaceStopId);
    const origin = stop?.coordinates;
    if (!origin) {
      onPreviewAlternative?.([]);
      return;
    }

    try {
      const response = await fetch("/api/routes/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waypoints: [origin, suggestion.coordinates], profile: "driving" })
      });
      const data = await response.json();
      const geometry = Array.isArray(data?.route?.geometry) ? data.route.geometry.filter(isCoordinate) : [];
      onPreviewAlternative?.(geometry.length >= 2 ? geometry : [origin, suggestion.coordinates]);
    } catch {
      onPreviewAlternative?.([origin, suggestion.coordinates]);
    }
  }
}

function isCoordinate(value: unknown): value is Coordinates {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && typeof (value as Coordinates).lat === "number"
    && typeof (value as Coordinates).lng === "number";
}
