import { getPlaceCoordinates } from "../data/bangkokGeo";
import { places } from "../data/places";
import type { MapPin, Place, PlannerRequest, RejectedCandidate, RouteStop, StopAlternative, TripPlan } from "../types";

const ROUTE_SIZE = 5;
const CANDIDATE_LIMIT = 15;
const BUDGET_RANK: Record<Place["budgetLevel"], number> = {
  budget: 1,
  medium: 2,
  premium: 3,
  luxury: 4
};

const DEFAULT_REQUEST: PlannerRequest = {
  selected: {
    Traveler: ["Couple"],
    Needs: ["Low walking load"],
    Vibe: ["Ancient Thailand"],
    Places: ["Museums", "Old town"],
    Food: ["Thai", "Dessert"],
    Prompt: ["Outdoor heat"]
  },
  budget: "Medium",
  prompt: "I want a calm cultural day with temples, Thai desserts, and not too much walking."
};

const TIMES = ["09:30", "11:00", "12:45", "14:30", "16:15"];

type ScoredPlace = Place & {
  matchScore: number;
  matchNotes: string[];
};

export type TyphoonRouteResponse = {
  title?: unknown;
  summary?: unknown;
  selectedPlaceIds?: unknown;
  stops?: unknown;
  overallScores?: unknown;
  rejectedCandidates?: unknown;
};

type TyphoonStop = {
  placeId?: unknown;
  time?: unknown;
  score?: unknown;
  reason?: unknown;
  vibeMatch?: unknown;
  budgetFit?: unknown;
  comfortNote?: unknown;
  emoji?: unknown;
  alternatives?: unknown;
};

type TyphoonStopAlternative = {
  placeId: string;
  reason?: string;
  tags?: string[];
};

type GeneratedStopFields = Pick<RouteStop, "score" | "reason" | "vibeMatch" | "budgetFit" | "comfortNote" | "time"> & {
  emoji?: string;
  alternatives?: StopAlternative[];
};

export function validatePlaceDataset() {
  const ids = new Set<string>();
  const errors: string[] = [];
  for (const place of places) {
    if (ids.has(place.id)) {
      errors.push(`Duplicate place id: ${place.id}`);
    }
    ids.add(place.id);
    if (!place.name || !place.kind || !place.area || !place.description) {
      errors.push(`Missing required display field: ${place.id}`);
    }
    if (!place.vibes.length || !place.emotions.length) {
      errors.push(`Missing vibe coverage: ${place.id}`);
    }
    if (!Number.isFinite(place.estimatedCost) || !Number.isFinite(place.durationMinutes)) {
      errors.push(`Invalid numeric values: ${place.id}`);
    }
  }
  if (places.length < 50 || places.length > 60) {
    errors.push(`Dataset must contain 50-60 places; found ${places.length}`);
  }
  return {
    count: places.length,
    uniqueIds: ids.size,
    errors
  };
}

export function getCandidatePlaces(request: PlannerRequest): ScoredPlace[] {
  const requestText = flattenRequest(request);
  const budgetRank = budgetToRank(request.budget);

  return places
    .filter((place) => place.realness === "real")
    .map((place) => scorePlace(place, requestText, budgetRank))
    .sort((a, b) => b.matchScore - a.matchScore || a.estimatedCost - b.estimatedCost)
    .slice(0, CANDIDATE_LIMIT);
}

export function buildLocalTripPlan(request: PlannerRequest = DEFAULT_REQUEST, setupMessage?: string): TripPlan {
  const candidates = getCandidatePlaces(request);
  return buildTripPlanFromPlaces(request, chooseFallbackStops(candidates, request), "fallback", setupMessage);
}

export function buildTripPlanFromTyphoon(request: PlannerRequest, candidates: Place[], response: TyphoonRouteResponse): TripPlan | null {
  const validation = validateTyphoonResponse(response, candidates);
  if (!validation.ok) {
    return null;
  }

  const stops = validation.selectedIds.map((placeId, index) => {
    const place = places.find((candidate) => candidate.id === placeId)!;
    const typhoonStop = validation.stops.find((stop) => stop.placeId === placeId);
    return toRouteStop(place, index, {
      score: clampScore(numberOrDefault(typhoonStop?.score, scorePlace(place, flattenRequest(request), budgetToRank(request.budget)).matchScore)),
      reason: stringOrDefault(typhoonStop?.reason, place.description),
      vibeMatch: stringOrDefault(typhoonStop?.vibeMatch, describeVibeMatch(place, request)),
      budgetFit: stringOrDefault(typhoonStop?.budgetFit, describeBudgetFit(place, request.budget)),
      comfortNote: stringOrDefault(typhoonStop?.comfortNote, describeComfort(place)),
      time: stringOrDefault(typhoonStop?.time, TIMES[index]),
      emoji: normalizeEmoji(typhoonStop?.emoji, place),
      alternatives: buildStopAlternatives(place, candidates, validation.selectedIds, request, typhoonStop?.alternatives)
    });
  });

  return {
    title: stringOrDefault(response.title, "Typhoon-Grounded Bangkok Route"),
    city: "Bangkok",
    duration: describeDuration(stops),
    estimatedBudget: sumBudget(stops),
    travelTime: "Mock 42-58 min transfer plan",
    walkingLoad: describeWalkingLoad(stops),
    summary: stringOrDefault(response.summary, "Typhoon selected five stops from locally allowed Bangkok candidates."),
    selectedPlaceIds: stops.map((stop) => stop.placeId),
    stops,
    scores: normalizeScores(response.overallScores, stops, request),
    rejectedCandidates: normalizeRejectedCandidates(response.rejectedCandidates, candidates, stops),
    source: "typhoon"
  };
}

export function validateTyphoonResponse(response: TyphoonRouteResponse, candidates: Place[]) {
  const candidateIds = new Set(candidates.map((candidate) => candidate.id));
  const selectedIds = Array.isArray(response.selectedPlaceIds)
    ? response.selectedPlaceIds.filter((id): id is string => typeof id === "string")
    : [];
  const stops = Array.isArray(response.stops) ? response.stops.filter(isObject) as TyphoonStop[] : [];
  const stopIds = stops.map((stop) => stop.placeId).filter((id): id is string => typeof id === "string");
  const allIds = selectedIds.length ? selectedIds : stopIds;
  const uniqueIds = new Set(allIds);

  if (allIds.length !== ROUTE_SIZE) {
    return { ok: false as const, reason: `Expected ${ROUTE_SIZE} selected IDs; received ${allIds.length}` };
  }
  if (uniqueIds.size !== allIds.length) {
    return { ok: false as const, reason: "Typhoon returned duplicate place IDs" };
  }
  for (const id of allIds) {
    if (!candidateIds.has(id)) {
      return { ok: false as const, reason: `Typhoon returned an unknown or non-candidate place ID: ${id}` };
    }
  }

  return {
    ok: true as const,
    selectedIds: allIds,
    stops
  };
}

export function extractJsonObject(text: string): TyphoonRouteResponse | null {
  const trimmed = text.trim();
  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  try {
    const parsed = JSON.parse(withoutFence.slice(start, end + 1));
    return isObject(parsed) ? parsed as TyphoonRouteResponse : null;
  } catch {
    return null;
  }
}

export function createMapPinsFromTripPlan(plan: TripPlan): MapPin[] {
  return plan.stops.map((stop, index) => {
    const place = places.find((candidate) => candidate.id === stop.placeId);
    return {
      id: `route-pin-${index + 1}`,
      label: stop.name,
      type: pinTypeForStop(stop.type),
      x: place?.mockCoordinates.x ?? 20 + index * 14,
      y: place?.mockCoordinates.y ?? 30 + index * 9,
      coordinates: place ? getPlaceCoordinates(place) : undefined,
      note: stop.reason,
      emoji: stop.emoji
    };
  });
}

export function createTyphoonPromptPayload(request: PlannerRequest, candidates: Place[]) {
  return {
    routeSize: ROUTE_SIZE,
    userPreferences: request,
    allowedPlaceIds: candidates.map((candidate) => candidate.id),
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      kind: candidate.kind,
      area: candidate.area,
      realness: candidate.realness,
      vibes: candidate.vibes,
      emotions: candidate.emotions,
      foodTags: candidate.foodTags,
      budgetLevel: candidate.budgetLevel,
      indoorOutdoor: candidate.indoorOutdoor,
      walkingLoad: candidate.walkingLoad,
      crowdLevel: candidate.crowdLevel,
      accessibility: candidate.accessibility,
      estimatedCost: candidate.estimatedCost,
      durationMinutes: candidate.durationMinutes,
      description: candidate.description
    })),
    requiredJsonShape: {
      title: "string",
      summary: "string",
      selectedPlaceIds: ["exactly five IDs from allowedPlaceIds"],
      stops: [
        {
          placeId: "allowed ID",
          time: "HH:mm",
          emoji: "one tourism category emoji for this exact stop",
          score: "0-100 number",
          reason: "short grounded reason",
          vibeMatch: "short grounded explanation",
          budgetFit: "short grounded explanation",
          comfortNote: "short grounded explanation",
          alternatives: [
            {
              placeId: "allowed ID not selected in selectedPlaceIds",
              reason: "short similar-vibe reason grounded in candidate data",
              tags: ["2-4 short similar-vibe or comfort tags"]
            },
            {
              placeId: "allowed ID not selected in selectedPlaceIds",
              reason: "short similar-vibe reason grounded in candidate data",
              tags: ["2-4 short similar-vibe or comfort tags"]
            }
          ]
        }
      ],
      overallScores: {
        crowdComfort: "0-100 number",
        foodMatch: "0-100 number",
        localAuthenticity: "0-100 number",
        accessibilityFit: "0-100 number",
        weatherSuitability: "0-100 number",
        budgetFit: "0-100 number"
      },
      rejectedCandidates: [
        {
          placeId: "allowed ID not selected",
          reason: "why it was not chosen"
        }
      ]
    }
  };
}

function buildTripPlanFromPlaces(request: PlannerRequest, selectedPlaces: ScoredPlace[], source: TripPlan["source"], setupMessage?: string): TripPlan {
  const selectedIds = selectedPlaces.slice(0, ROUTE_SIZE).map((place) => place.id);
  const candidates = getCandidatePlaces(request);
  const stops = selectedPlaces.slice(0, ROUTE_SIZE).map((place, index) => toRouteStop(place, index, {
    score: clampScore(place.matchScore),
    reason: place.matchNotes[0] ?? place.description,
    vibeMatch: describeVibeMatch(place, request),
    budgetFit: describeBudgetFit(place, request.budget),
    comfortNote: describeComfort(place),
    time: TIMES[index],
    emoji: emojiForPlace(place),
    alternatives: buildStopAlternatives(place, candidates, selectedIds, request)
  }));

  return {
    title: createRouteTitle(request, source),
    city: "Bangkok",
    duration: describeDuration(stops),
    estimatedBudget: sumBudget(stops),
    travelTime: "Mock 42-58 min transfer plan",
    walkingLoad: describeWalkingLoad(stops),
    summary: createSummary(request, stops, source),
    selectedPlaceIds: stops.map((stop) => stop.placeId),
    stops,
    scores: deriveScores(stops, request),
    rejectedCandidates: createRejectedCandidates(getCandidatePlaces(request), stops),
    source,
    setupMessage
  };
}

function chooseFallbackStops(candidates: ScoredPlace[], request: PlannerRequest) {
  const picked: ScoredPlace[] = [];
  const requestText = flattenRequest(request);
  const needsFood = hasAny(requestText, ["food", "thai", "dessert", "cafe", "coffee", "vegan", "vegetarian", "halal", "seafood"]);
  const needsCulture = hasAny(requestText, ["ancient", "temple", "museum", "culture", "old town", "spiritual"]);

  const addFirst = (predicate: (place: ScoredPlace) => boolean) => {
    const next = candidates.find((place) => predicate(place) && !picked.some((item) => item.id === place.id));
    if (next) {
      picked.push(next);
    }
  };

  if (needsCulture) {
    addFirst((place) => ["Temple", "Museum", "Cultural landmark"].includes(place.kind));
  }
  if (needsFood) {
    addFirst((place) => ["Restaurant", "Cafe", "Market"].includes(place.kind));
  }
  if (hasAny(requestText, ["low walking", "step-free", "indoor", "heat", "rain"])) {
    addFirst((place) => place.indoorOutdoor === "indoor" && place.walkingLoad === "low");
  }
  if (hasAny(requestText, ["dessert", "cafe", "slow", "cozy"])) {
    addFirst((place) => place.kind === "Cafe");
  }

  for (const place of candidates) {
    if (picked.length >= ROUTE_SIZE) {
      break;
    }
    if (!picked.some((item) => item.id === place.id) && hasUsefulDiversity(place, picked)) {
      picked.push(place);
    }
  }

  for (const place of candidates) {
    if (picked.length >= ROUTE_SIZE) {
      break;
    }
    if (!picked.some((item) => item.id === place.id)) {
      picked.push(place);
    }
  }

  return picked;
}

function scorePlace(place: Place, requestText: string, budgetRank: number): ScoredPlace {
  let score = 48;
  const notes: string[] = [];

  for (const vibe of place.vibes) {
    if (requestText.includes(normalize(vibe))) {
      score += 12;
      notes.push(`Matches ${vibe.toLowerCase()} route intent.`);
    }
  }
  for (const emotion of place.emotions) {
    if (requestText.includes(normalize(emotion))) {
      score += 5;
    }
  }
  for (const foodTag of place.foodTags) {
    if (requestText.includes(normalize(foodTag)) || requestText.includes(normalize(foodTag.replace("-", " ")))) {
      score += 10;
      notes.push(`Fits requested ${foodTag.replace("-", " ")} preference.`);
    }
  }

  if (matchesKindPreference(place, requestText)) {
    score += 15;
    notes.push(`Fits the preferred ${place.kind.toLowerCase()} category.`);
  }
  if (requestText.includes(normalize(place.area))) {
    score += 8;
    notes.push(`Keeps the route around ${place.area}.`);
  }
  if (place.realness === "real") {
    score += requestText.includes("local") || requestText.includes("authentic") ? 6 : 2;
  }

  const budgetGap = Math.abs(BUDGET_RANK[place.budgetLevel] - budgetRank);
  score += Math.max(0, 12 - budgetGap * 7);
  if (budgetGap === 0) {
    notes.push(`Fits the ${rankToBudgetLabel(budgetRank)} budget tier.`);
  }

  if (hasAny(requestText, ["low walking", "step-free", "mobility", "pregnant", "elderly", "with child"])) {
    if (place.walkingLoad === "low") score += 14;
    if (place.walkingLoad === "high") score -= 22;
    if (place.accessibility === "good") score += 10;
    if (place.accessibility === "limited") score -= 14;
  }

  if (hasAny(requestText, ["indoor", "heat", "rain", "pm2.5"])) {
    if (place.indoorOutdoor === "indoor") score += 12;
    if (place.indoorOutdoor === "outdoor") score -= 12;
  }

  if (hasAny(requestText, ["quiet", "crowded", "crowd"])) {
    if (place.crowdLevel === "low") score += 10;
    if (place.crowdLevel === "high") score -= 14;
  }

  if (hasAny(requestText, ["expensive", "budget traveler"]) && ["premium", "luxury"].includes(place.budgetLevel)) {
    score -= 20;
  }
  if (hasAny(requestText, ["outdoor heat", "avoid intense heat"]) && place.indoorOutdoor === "outdoor") {
    score -= 16;
  }
  if (hasAny(requestText, ["tourist trap"]) && place.crowdLevel === "high") {
    score -= 10;
  }

  return {
    ...place,
    matchScore: clampScore(score),
    matchNotes: notes.length ? notes : [place.description]
  };
}

function matchesKindPreference(place: Place, requestText: string) {
  const kindMap: Record<Place["kind"], string[]> = {
    Temple: ["temple", "temples", "spiritual", "ancient"],
    Museum: ["museum", "museums", "culture", "indoor"],
    Cafe: ["cafe", "cafes", "dessert", "bakery", "coffee", "cozy"],
    Restaurant: ["restaurant", "restaurants", "food", "foodie", "thai"],
    Market: ["market", "markets", "street food", "shopping"],
    "Scenic stop": ["riverside", "photo", "nature", "scenic", "romantic"],
    Wellness: ["wellness", "massage", "relaxed", "spa"],
    Workshop: ["workshop", "craft", "hands-on"],
    Shopping: ["shopping", "mall", "indoor"],
    "Cultural landmark": ["landmark", "culture", "ancient", "old town"]
  };
  return kindMap[place.kind].some((token) => requestText.includes(token));
}

function toRouteStop(place: Place, index: number, generated: GeneratedStopFields): RouteStop {
  return {
    placeId: place.id,
    time: generated.time || TIMES[index],
    name: place.name,
    type: place.kind,
    area: place.area,
    reason: generated.reason,
    estimatedCost: place.estimatedCost,
    durationMinutes: place.durationMinutes,
    tags: [...place.vibes.slice(0, 2), place.budgetLevel, place.indoorOutdoor],
    comfortNote: generated.comfortNote,
    score: generated.score,
    vibeMatch: generated.vibeMatch,
    budgetFit: generated.budgetFit,
    coordinates: getPlaceCoordinates(place),
    emoji: generated.emoji ?? emojiForPlace(place),
    alternatives: generated.alternatives ?? []
  };
}

function normalizeScores(rawScores: unknown, stops: RouteStop[], request: PlannerRequest) {
  if (!isObject(rawScores)) {
    return deriveScores(stops, request);
  }
  return {
    crowdComfort: clampScore(numberOrDefault(rawScores.crowdComfort, deriveScores(stops, request).crowdComfort)),
    foodMatch: clampScore(numberOrDefault(rawScores.foodMatch, deriveScores(stops, request).foodMatch)),
    localAuthenticity: clampScore(numberOrDefault(rawScores.localAuthenticity, deriveScores(stops, request).localAuthenticity)),
    accessibilityFit: clampScore(numberOrDefault(rawScores.accessibilityFit, deriveScores(stops, request).accessibilityFit)),
    weatherSuitability: clampScore(numberOrDefault(rawScores.weatherSuitability, deriveScores(stops, request).weatherSuitability)),
    budgetFit: clampScore(numberOrDefault(rawScores.budgetFit, deriveScores(stops, request).budgetFit))
  };
}

function deriveScores(stops: RouteStop[], request: PlannerRequest) {
  const selectedPlaces = stops.map((stop) => places.find((place) => place.id === stop.placeId)).filter(Boolean) as Place[];
  const text = flattenRequest(request);
  const foodMatches = selectedPlaces.filter((place) => place.foodTags.some((tag) => text.includes(normalize(tag)) || text.includes(normalize(tag.replace("-", " "))))).length;
  const lowCrowd = selectedPlaces.filter((place) => place.crowdLevel !== "high").length;
  const local = selectedPlaces.filter((place) => place.realness === "real" || place.vibes.includes("Local & Authentic")).length;
  const accessible = selectedPlaces.filter((place) => place.accessibility !== "limited" && place.walkingLoad !== "high").length;
  const weather = selectedPlaces.filter((place) => place.indoorOutdoor !== "outdoor" || place.walkingLoad === "low").length;
  const budgetRank = budgetToRank(request.budget);
  const budgetFits = selectedPlaces.filter((place) => BUDGET_RANK[place.budgetLevel] <= budgetRank + 1).length;

  return {
    crowdComfort: ratioScore(lowCrowd, selectedPlaces.length, 68),
    foodMatch: ratioScore(foodMatches, selectedPlaces.length, 62),
    localAuthenticity: ratioScore(local, selectedPlaces.length, 70),
    accessibilityFit: ratioScore(accessible, selectedPlaces.length, 66),
    weatherSuitability: ratioScore(weather, selectedPlaces.length, 65),
    budgetFit: ratioScore(budgetFits, selectedPlaces.length, 72)
  };
}

function normalizeRejectedCandidates(rawRejected: unknown, candidates: Place[], stops: RouteStop[]): RejectedCandidate[] {
  const selected = new Set(stops.map((stop) => stop.placeId));
  if (Array.isArray(rawRejected)) {
    return rawRejected
      .filter(isObject)
      .map((item) => ({
        placeId: typeof item.placeId === "string" ? item.placeId : "",
        reason: typeof item.reason === "string" ? item.reason : "Not selected by Typhoon."
      }))
      .filter((item) => candidates.some((candidate) => candidate.id === item.placeId) && !selected.has(item.placeId))
      .slice(0, 4);
  }
  return createRejectedCandidates(candidates as ScoredPlace[], stops);
}

function createRejectedCandidates(candidates: ScoredPlace[], stops: RouteStop[]): RejectedCandidate[] {
  const selected = new Set(stops.map((stop) => stop.placeId));
  return candidates
    .filter((candidate) => !selected.has(candidate.id))
    .slice(0, 4)
    .map((candidate) => ({
      placeId: candidate.id,
      reason: candidate.walkingLoad === "high"
        ? "Saved as an alternate because it adds more walking friction."
        : candidate.crowdLevel === "high"
          ? "Saved as an alternate because the crowd load is higher."
          : "Good match, but the five-stop route needed tighter pacing."
    }));
}

function createRouteTitle(request: PlannerRequest, source: TripPlan["source"]) {
  const vibe = request.selected.Vibe?.[0] ?? "Bangkok";
  return source === "typhoon" ? `Typhoon ${vibe} Route` : `${vibe} Bangkok Route`;
}

function createSummary(request: PlannerRequest, stops: RouteStop[], source: TripPlan["source"]) {
  const food = request.selected.Food?.slice(0, 2).join(" and ") || "local food";
  const sourceLabel = source === "fallback" ? "Local fallback selected" : "Typhoon selected";
  return `${sourceLabel} ${stops.length} grounded stops around ${food}, comfort, and Bangkok pacing.`;
}

function describeDuration(stops: RouteStop[]) {
  const minutes = stops.reduce((sum, stop) => sum + stop.durationMinutes, 0) + Math.max(0, stops.length - 1) * 14;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function describeWalkingLoad(stops: RouteStop[]) {
  const selectedPlaces = stops.map((stop) => places.find((place) => place.id === stop.placeId)).filter(Boolean) as Place[];
  if (selectedPlaces.some((place) => place.walkingLoad === "high")) return "Medium-high";
  if (selectedPlaces.filter((place) => place.walkingLoad === "medium").length >= 3) return "Medium";
  return "Low";
}

function describeVibeMatch(place: Place, request: PlannerRequest) {
  const requestText = flattenRequest(request);
  const matchedVibe = place.vibes.find((vibe) => requestText.includes(normalize(vibe)));
  return matchedVibe ? `Matches ${matchedVibe.toLowerCase()} preference.` : `Adds ${place.vibes[0].toLowerCase()} character.`;
}

function describeBudgetFit(place: Place, budget: string) {
  const rank = budgetToRank(budget);
  const gap = BUDGET_RANK[place.budgetLevel] - rank;
  if (gap <= 0) return `${place.estimatedCost} THB keeps this within ${budget.toLowerCase()} pacing.`;
  if (gap === 1) return `${place.estimatedCost} THB is a slight stretch but still plausible.`;
  return `${place.estimatedCost} THB is a premium choice; monitor spend.`;
}

function describeComfort(place: Place) {
  const indoor = place.indoorOutdoor === "indoor" ? "Indoor" : place.indoorOutdoor === "mixed" ? "Mixed indoor/outdoor" : "Outdoor";
  return `${indoor}, ${place.walkingLoad} walking, ${place.crowdLevel} crowd, ${place.accessibility} access.`;
}

function buildStopAlternatives(
  stopPlace: Place,
  candidates: Place[],
  selectedIds: string[],
  request: PlannerRequest,
  rawAlternatives?: unknown
): StopAlternative[] {
  const selected = new Set(selectedIds);
  const candidateIds = new Set(candidates.map((candidate) => candidate.id));
  const acceptedFromTyphoon = parseTyphoonAlternatives(rawAlternatives)
    .filter((alternative) => candidateIds.has(alternative.placeId) && !selected.has(alternative.placeId))
    .map((alternative) => {
      const place = candidates.find((candidate) => candidate.id === alternative.placeId);
      return place ? createStopAlternative(stopPlace, place, request, alternative.reason, alternative.tags) : null;
    })
    .filter((alternative): alternative is StopAlternative => Boolean(alternative));

  if (acceptedFromTyphoon.length >= 2) {
    return dedupeAlternatives(acceptedFromTyphoon).slice(0, 2);
  }

  const used = new Set(acceptedFromTyphoon.map((alternative) => alternative.placeId));
  const deterministic = [...candidates]
    .filter((candidate) => !selected.has(candidate.id) && candidate.id !== stopPlace.id && !used.has(candidate.id))
    .map((candidate) => ({
      place: candidate,
      score: scoreAlternative(stopPlace, candidate, request)
    }))
    .sort((a, b) => b.score - a.score || alternativeDistanceKm(stopPlace, a.place) - alternativeDistanceKm(stopPlace, b.place))
    .map(({ place }) => createStopAlternative(stopPlace, place, request));

  return dedupeAlternatives([...acceptedFromTyphoon, ...deterministic]).slice(0, 2);
}

function parseTyphoonAlternatives(rawAlternatives: unknown): TyphoonStopAlternative[] {
  if (!Array.isArray(rawAlternatives)) {
    return [];
  }
  return rawAlternatives.filter(isObject).map((item) => ({
    placeId: typeof item.placeId === "string" ? item.placeId : "",
    reason: typeof item.reason === "string" ? item.reason : "",
    tags: Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === "string") : []
  }));
}

function createStopAlternative(
  stopPlace: Place,
  alternativePlace: Place,
  request: PlannerRequest,
  reason?: string,
  tags?: string[]
): StopAlternative {
  return {
    placeId: alternativePlace.id,
    name: alternativePlace.name,
    type: alternativePlace.kind,
    emoji: emojiForPlace(alternativePlace),
    reason: stringOrDefault(reason, createAlternativeReason(stopPlace, alternativePlace, request)),
    distanceKm: Number(alternativeDistanceKm(stopPlace, alternativePlace).toFixed(1)),
    tags: (tags?.length ? tags : createAlternativeTags(stopPlace, alternativePlace)).slice(0, 4),
    coordinates: getPlaceCoordinates(alternativePlace)
  };
}

function createAlternativeReason(stopPlace: Place, alternativePlace: Place, request: PlannerRequest) {
  const sharedVibe = alternativePlace.vibes.find((vibe) => stopPlace.vibes.includes(vibe));
  const requestText = flattenRequest(request);
  if (sharedVibe) {
    return `${alternativePlace.name} keeps the ${sharedVibe.toLowerCase()} mood while changing the stop type to ${alternativePlace.kind.toLowerCase()}.`;
  }
  if (matchesKindPreference(alternativePlace, requestText)) {
    return `${alternativePlace.name} still matches the requested ${alternativePlace.kind.toLowerCase()} direction with a different Bangkok area.`;
  }
  if (alternativePlace.walkingLoad === "low" && stopPlace.walkingLoad !== "low") {
    return `${alternativePlace.name} keeps a similar day shape with lower walking friction.`;
  }
  return `${alternativePlace.name} has a nearby, compatible vibe and keeps the route grounded in real Bangkok candidates.`;
}

function createAlternativeTags(stopPlace: Place, alternativePlace: Place) {
  const shared = alternativePlace.vibes.filter((vibe) => stopPlace.vibes.includes(vibe)).slice(0, 2);
  return [...shared, alternativePlace.budgetLevel, alternativePlace.walkingLoad, alternativePlace.indoorOutdoor]
    .filter((tag, index, list) => list.indexOf(tag) === index)
    .slice(0, 4);
}

function scoreAlternative(stopPlace: Place, alternativePlace: Place, request: PlannerRequest) {
  let score = 0;
  if (stopPlace.kind === alternativePlace.kind) score += 28;
  score += alternativePlace.vibes.filter((vibe) => stopPlace.vibes.includes(vibe)).length * 12;
  score += alternativePlace.foodTags.filter((tag) => stopPlace.foodTags.includes(tag)).length * 9;
  if (stopPlace.budgetLevel === alternativePlace.budgetLevel) score += 10;
  if (stopPlace.walkingLoad === alternativePlace.walkingLoad) score += 8;
  if (alternativePlace.walkingLoad === "low") score += 6;
  if (alternativePlace.crowdLevel !== "high") score += 6;
  if (matchesKindPreference(alternativePlace, flattenRequest(request))) score += 12;
  score -= Math.min(20, alternativeDistanceKm(stopPlace, alternativePlace) * 1.8);
  return score;
}

function dedupeAlternatives(alternatives: StopAlternative[]) {
  const seen = new Set<string>();
  return alternatives.filter((alternative) => {
    if (seen.has(alternative.placeId)) return false;
    seen.add(alternative.placeId);
    return true;
  });
}

function alternativeDistanceKm(a: Place, b: Place) {
  return haversineKm(getPlaceCoordinates(a), getPlaceCoordinates(b));
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earthKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthKm * Math.asin(Math.sqrt(h));
}

function toRadians(value: number) {
  return value * Math.PI / 180;
}

function normalizeEmoji(value: unknown, place: Place) {
  if (typeof value !== "string") {
    return emojiForPlace(place);
  }
  const trimmed = value.trim();
  return trimmed && trimmed.length <= 6 ? trimmed : emojiForPlace(place);
}

function emojiForPlace(place: Pick<Place, "kind"> | Pick<RouteStop, "type">) {
  const kind = "kind" in place ? place.kind : place.type;
  const emojiByKind: Record<string, string> = {
    Temple: "\u{1f6d5}",
    Museum: "\u{1f3db}\ufe0f",
    Cafe: "\u2615",
    Restaurant: "\u{1f35c}",
    Market: "\u{1f6cd}\ufe0f",
    "Scenic stop": "\u{1f333}",
    Wellness: "\u{1f486}",
    Workshop: "\u{1f9f5}",
    Shopping: "\u{1f6d2}",
    "Cultural landmark": "\u{1f3ef}"
  };
  return emojiByKind[kind] ?? "\u{1f4cd}";
}

function sumBudget(stops: RouteStop[]) {
  return stops.reduce((sum, stop) => sum + stop.estimatedCost, 0);
}

function flattenRequest(request: PlannerRequest) {
  return normalize([
    request.budget,
    request.prompt,
    ...Object.values(request.selected).flat()
  ].join(" "));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9ก-๙]+/g, " ").replace(/\s+/g, " ").trim();
}

function budgetToRank(budget: string) {
  const normalized = normalize(budget);
  if (normalized.includes("luxury")) return 4;
  if (normalized.includes("premium")) return 3;
  if (normalized.includes("medium")) return 2;
  return 1;
}

function rankToBudgetLabel(rank: number) {
  return ["budget", "budget", "medium", "premium", "luxury"][rank] ?? "medium";
}

function hasAny(text: string, tokens: string[]) {
  return tokens.some((token) => text.includes(normalize(token)));
}

function hasUsefulDiversity(place: ScoredPlace, picked: ScoredPlace[]) {
  const sameKindCount = picked.filter((item) => item.kind === place.kind).length;
  const sameAreaCount = picked.filter((item) => item.area === place.area).length;
  return sameKindCount < 2 && sameAreaCount < 3;
}

function ratioScore(count: number, total: number, floor: number) {
  if (!total) return floor;
  return clampScore(floor + Math.round((count / total) * (100 - floor)));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function numberOrDefault(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringOrDefault(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pinTypeForStop(type: string): MapPin["type"] {
  if (["Restaurant", "Cafe", "Market"].includes(type)) return "food";
  if (["Temple", "Museum", "Cultural landmark"].includes(type)) return "culture";
  if (["Wellness", "Workshop"].includes(type)) return "local";
  return "recommended";
}
