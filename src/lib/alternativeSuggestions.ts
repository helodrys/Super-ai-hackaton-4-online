import { getPlaceCoordinates } from "../data/bangkokGeo";
import { places } from "../data/places";
import type { AlternativeSuggestion, Coordinates, Place, TripPlan } from "../types";

const SPECIAL_PLACES = [
  {
    id: "dog-in-town-ari",
    name: "Dog In Town Ari",
    type: "Dog cafe",
    coordinates: { lat: 13.7796, lng: 100.5447 },
    tags: ["dog cafe", "pet interest", "indoor pause"],
    reason: "Ari dog cafe option for travelers who want a more playful, pet-focused detour."
  },
  {
    id: "corgi-in-the-garden",
    name: "Corgi in the Garden",
    type: "Dog cafe",
    coordinates: { lat: 13.7215, lng: 100.5076 },
    tags: ["dog cafe", "riverside", "indoor pause"],
    reason: "Corgi cafe near the riverside corridor for a more special animal-cafe stop."
  }
];

export function buildAlternativeSuggestions(plan: TripPlan): AlternativeSuggestion[] {
  const selected = new Set(plan.selectedPlaceIds);
  const selectedPlaces = plan.stops
    .map((stop) => ({ stop, place: places.find((candidate) => candidate.id === stop.placeId) }))
    .filter((item): item is { stop: TripPlan["stops"][number]; place: Place } => Boolean(item.place));

  const suggestions: AlternativeSuggestion[] = [];
  const outdoorStop = selectedPlaces.find(({ place }) => place.indoorOutdoor === "outdoor" || place.walkingLoad === "high" || place.crowdLevel === "high")
    ?? selectedPlaces[0];
  const indoorCandidate = places.find((place) => place.realness === "real"
    && !selected.has(place.id)
    && place.indoorOutdoor === "indoor"
    && place.walkingLoad === "low"
    && ["Cafe", "Museum", "Shopping", "Restaurant"].includes(place.kind));

  if (outdoorStop && indoorCandidate) {
    suggestions.push({
      id: "pm25-indoor-ac",
      trigger: "PM2.5 / allergy",
      title: "Swap to an indoor AC stop",
      replaceStopId: outdoorStop.stop.placeId,
      candidatePlaceId: indoorCandidate.id,
      candidateName: indoorCandidate.name,
      candidateType: indoorCandidate.kind,
      coordinates: getPlaceCoordinates(indoorCandidate),
      reason: `${indoorCandidate.name} is indoor, lower walking, and a better backup when PM2.5, heat, or allergy risk rises.`,
      score: 91,
      routeDeltaMinutes: 8,
      comfortTags: ["Air-conditioned", "Low walking", "PM2.5 safer"]
    });
  }

  const dogCafe = pickNearestSpecial(selectedPlaces[0]?.stop.coordinates, SPECIAL_PLACES);
  if (selectedPlaces[0] && dogCafe) {
    suggestions.push({
      id: "dog-cafe-special",
      trigger: "Special interest",
      title: "Add a dog cafe detour",
      replaceStopId: selectedPlaces[0].stop.placeId,
      candidatePlaceId: dogCafe.id,
      candidateName: dogCafe.name,
      candidateType: dogCafe.type,
      coordinates: dogCafe.coordinates,
      reason: dogCafe.reason,
      score: 88,
      routeDeltaMinutes: 14,
      comfortTags: dogCafe.tags
    });
  }

  const crowdedStop = selectedPlaces.find(({ place }) => place.crowdLevel === "high") ?? selectedPlaces[1];
  const calmCandidate = places.find((place) => place.realness === "real"
    && !selected.has(place.id)
    && place.crowdLevel === "low"
    && place.walkingLoad !== "high");

  if (crowdedStop && calmCandidate) {
    suggestions.push({
      id: "calmer-nearby-route",
      trigger: "Crowd / delay",
      title: "Keep the route calmer",
      replaceStopId: crowdedStop.stop.placeId,
      candidatePlaceId: calmCandidate.id,
      candidateName: calmCandidate.name,
      candidateType: calmCandidate.kind,
      coordinates: getPlaceCoordinates(calmCandidate),
      reason: `${calmCandidate.name} keeps the day grounded while lowering crowd friction and walking pressure.`,
      score: 86,
      routeDeltaMinutes: 6,
      comfortTags: ["Lower crowd", "Real Bangkok seed", "Gentler pacing"]
    });
  }

  return suggestions.slice(0, 3);
}

function pickNearestSpecial(origin: Coordinates | undefined, specials: typeof SPECIAL_PLACES) {
  if (!origin) return specials[0];
  return [...specials].sort((a, b) => roughDistance(origin, a.coordinates) - roughDistance(origin, b.coordinates))[0];
}

function roughDistance(a: Coordinates, b: Coordinates) {
  return Math.abs(a.lat - b.lat) + Math.abs(a.lng - b.lng);
}
