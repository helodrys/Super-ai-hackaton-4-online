import { motion } from "framer-motion";
import { ChevronDown, Route } from "lucide-react";
import { useState } from "react";
import { revealItem, staggerContainer } from "../../lib/motion";
import { useTripConditions } from "../../lib/tripConditions";
import type { Coordinates, RouteStop, StopAlternative, TripPlan } from "../../types";
import { TripConditionsMini } from "../trip/TripConditionsMini";

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
          <ItineraryStopCard
            key={stop.placeId}
            stop={stop}
            index={index}
            expanded={expanded}
            onToggle={() => toggleStop(stop.placeId)}
            onPreviewAlternative={onPreviewAlternative}
          />
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

function ItineraryStopCard({
  stop,
  index,
  expanded,
  onToggle,
  onPreviewAlternative
}: {
  stop: RouteStop;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onPreviewAlternative?: (coordinates: Coordinates[]) => void;
}) {
  const conditions = useTripConditions(stop.coordinates);

  return (
    <motion.article className="timeline-stop" variants={revealItem}>
      <div className="timeline-number">{stop.emoji ?? index + 1}</div>
      <div className="timeline-content">
        <button
          type="button"
          className="timeline-stop-toggle"
          aria-expanded={expanded}
          onClick={onToggle}
        >
          <div>
            <span>{stop.time} - {stop.type}</span>
            <h3>{index + 1}. {stop.name}</h3>
          </div>
          <ChevronDown size={18} />
        </button>
        <p>{stop.reason}</p>
        <div className="tag-row">
          {stop.tags.map((tag) => <em key={tag}>{tag}</em>)}
        </div>
        <div className="timeline-stop-context">
          <span className="location-classifier">{stop.type}</span>
          <TripConditionsMini {...conditions} />
        </div>
        <p className="timeline-fit-note">{stop.vibeMatch}</p>
        <small>{stop.comfortNote}</small>
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
