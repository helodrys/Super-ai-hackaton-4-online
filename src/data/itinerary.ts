import { buildLocalTripPlan } from "../lib/plannerEngine";

export const itinerary = buildLocalTripPlan();

export const alternativeRoutes = [
  {
    label: "Main Route",
    summary: "Balanced culture, food, and comfort for a warm Bangkok afternoon.",
    score: 86
  },
  {
    label: "Rainy Day",
    summary: "More indoor time with Museum Siam first and a covered market backup.",
    score: 83
  },
  {
    label: "More Local",
    summary: "Adds a smaller food stop and neighborhood culture to support local businesses.",
    score: 89
  },
  {
    label: "Low Walking",
    summary: "Shorter transfers, fewer outdoor links, and step-free-friendly stop order.",
    score: 81
  }
];
