import { buildLocalTripPlan } from "./plannerEngine";
import type { PlannerRequest, TripPlan } from "../types";

export async function planTrip(request: PlannerRequest): Promise<TripPlan> {
  try {
    const response = await fetch("/api/plan-trip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Planner API returned ${response.status}`);
    }

    const data = await response.json();
    if (isTripPlan(data)) {
      return data;
    }
    throw new Error("Planner API returned an invalid route shape");
  } catch (error) {
    return buildLocalTripPlan(request, error instanceof Error ? error.message : "Planner API unavailable");
  }
}

function isTripPlan(value: unknown): value is TripPlan {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const plan = value as Partial<TripPlan>;
  return typeof plan.title === "string"
    && Array.isArray(plan.stops)
    && plan.stops.length === 5
    && Array.isArray(plan.selectedPlaceIds)
    && typeof plan.summary === "string"
    && (plan.source === "typhoon" || plan.source === "fallback");
}
