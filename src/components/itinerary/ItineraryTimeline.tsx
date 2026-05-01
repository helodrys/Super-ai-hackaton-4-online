import { motion } from "framer-motion";
import { ChevronDown, Route } from "lucide-react";
import { useState } from "react";
import { revealItem, staggerContainer } from "../../lib/motion";
import type { Coordinates, StopAlternative, TripPlan } from "../../types";

type ItineraryTimelineProps = {
  plan: TripPlan;
  onPreviewAlternative?: (coordinates: Coordinates[]) => void;
};

export function ItineraryTimeline({ plan, onPreviewAlternative }: ItineraryTimelineProps) {
  const [expandedStopId, setExpandedStopId] = useState<string | null>(null);

  return (
    <motion.section className="timeline" variants={staggerContainer} initial="hidden" animate="show">
      {plan.stops.map((stop, index) => {
        const expanded = expandedStopId === stop.placeId;
        return (
          <motion.article key={stop.placeId} className="timeline-stop" variants={revealItem}>
            <div className="timeline-number">{stop.emoji ?? index + 1}</div>
            <div className="timeline-content">
              <button
                type="button"
                className="timeline-stop-toggle"
                aria-expanded={expanded}
                onClick={() => toggleStop(stop.placeId)}
              >
                <span>{stop.time} - {stop.type} - {stop.score}/100 fit</span>
                <h3>{index + 1}. {stop.name}</h3>
                <ChevronDown size={18} />
              </button>
              <p>{stop.reason}</p>
              <div className="tag-row">
                {stop.tags.map((tag) => <em key={tag}>{tag}</em>)}
              </div>
              <p className="timeline-fit-note">{stop.vibeMatch} {stop.budgetFit}</p>
              <small>{stop.comfortNote} Est. {stop.estimatedCost} THB</small>
              {expanded && (
                <div className="stop-alternative-list">
                  {(stop.alternatives ?? []).map((alternative) => (
                    <AlternativeCard
                      key={alternative.placeId}
                      stopCoordinates={stop.coordinates}
                      alternative={alternative}
                      onPreviewAlternative={onPreviewAlternative}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.article>
        );
      })}
    </motion.section>
  );

  function toggleStop(placeId: string) {
    setExpandedStopId((current) => {
      const next = current === placeId ? null : placeId;
      if (!next) {
        onPreviewAlternative?.([]);
      }
      return next;
    });
  }
}

function AlternativeCard({ stopCoordinates, alternative, onPreviewAlternative }: {
  stopCoordinates?: Coordinates;
  alternative: StopAlternative;
  onPreviewAlternative?: (coordinates: Coordinates[]) => void;
}) {
  return (
    <button
      type="button"
      className="stop-alternative-card"
      onClick={() => previewAlternative(stopCoordinates, alternative, onPreviewAlternative)}
    >
      <span className="stop-alternative-icon">{alternative.emoji}</span>
      <div>
        <span>{alternative.type} - {alternative.distanceKm.toFixed(1)} km away</span>
        <strong>{alternative.name}</strong>
        <p>{alternative.reason}</p>
        <div className="alternative-tag-row">
          {alternative.tags.map((tag) => <em key={tag}>{tag}</em>)}
        </div>
      </div>
      <Route size={17} />
    </button>
  );
}

async function previewAlternative(
  stopCoordinates: Coordinates | undefined,
  alternative: StopAlternative,
  onPreviewAlternative?: (coordinates: Coordinates[]) => void
) {
  if (!stopCoordinates) {
    onPreviewAlternative?.([]);
    return;
  }

  try {
    const response = await fetch("/api/routes/compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waypoints: [stopCoordinates, alternative.coordinates], profile: "driving" })
    });
    const data = await response.json();
    const geometry = Array.isArray(data?.route?.geometry) ? data.route.geometry.filter(isCoordinate) : [];
    onPreviewAlternative?.(geometry.length >= 2 ? geometry : [stopCoordinates, alternative.coordinates]);
  } catch {
    onPreviewAlternative?.([stopCoordinates, alternative.coordinates]);
  }
}

function isCoordinate(value: unknown): value is Coordinates {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && typeof (value as Coordinates).lat === "number"
    && typeof (value as Coordinates).lng === "number"
    && Number.isFinite((value as Coordinates).lat)
    && Number.isFinite((value as Coordinates).lng);
}
