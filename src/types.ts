export type PageKey = "dashboard" | "taxi" | "planner" | "itinerary";

export type RiskLevel = "Low" | "Medium" | "High";

export type PinType = "risk" | "recommended" | "local" | "food" | "culture";

export type MapPin = {
  id: string;
  label: string;
  type: PinType;
  x: number;
  y: number;
  coordinates?: Coordinates;
  note: string;
  emoji?: string;
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type RouteLeg = {
  from: Coordinates;
  to: Coordinates;
  distanceMeters: number;
  durationSeconds: number;
  geometry: Coordinates[];
};

export type RouteGeometry = {
  distanceMeters: number;
  durationSeconds: number;
  trafficDurationSeconds: number;
  geometry: Coordinates[];
  legs: RouteLeg[];
  source: "osrm-openstreetmap" | "local-haversine" | "google-routes" | "fallback-line";
};

export type RouteStop = {
  placeId: string;
  time: string;
  name: string;
  type: string;
  area: string;
  reason: string;
  estimatedCost: number;
  durationMinutes: number;
  tags: string[];
  comfortNote: string;
  score: number;
  vibeMatch: string;
  budgetFit: string;
  coordinates?: Coordinates;
  emoji?: string;
  alternatives?: StopAlternative[];
};

export type StopAlternative = {
  placeId: string;
  name: string;
  type: string;
  emoji: string;
  reason: string;
  distanceKm: number;
  tags: string[];
  coordinates: Coordinates;
};

export type PlaceKind =
  | "Temple"
  | "Museum"
  | "Cafe"
  | "Restaurant"
  | "Market"
  | "Scenic stop"
  | "Wellness"
  | "Workshop"
  | "Shopping"
  | "Cultural landmark";

export type Place = {
  id: string;
  name: string;
  kind: PlaceKind;
  area: string;
  realness: "real" | "demo";
  vibes: string[];
  emotions: string[];
  foodTags: string[];
  budgetLevel: "budget" | "medium" | "premium" | "luxury";
  indoorOutdoor: "indoor" | "outdoor" | "mixed";
  walkingLoad: "low" | "medium" | "high";
  crowdLevel: "low" | "medium" | "high";
  accessibility: "good" | "moderate" | "limited";
  estimatedCost: number;
  durationMinutes: number;
  mockCoordinates: {
    x: number;
    y: number;
  };
  description: string;
};

export type PlannerRequest = {
  selected: Record<string, string[]>;
  budget: string;
  prompt: string;
};

export type OverallScores = {
  crowdComfort: number;
  foodMatch: number;
  localAuthenticity: number;
  accessibilityFit: number;
  weatherSuitability: number;
  budgetFit: number;
};

export type RejectedCandidate = {
  placeId: string;
  reason: string;
};

export type AlternativeSuggestion = {
  id: string;
  trigger: string;
  title: string;
  replaceStopId: string;
  candidatePlaceId: string;
  candidateName: string;
  candidateType: string;
  coordinates: Coordinates;
  reason: string;
  score: number;
  routeDeltaMinutes: number;
  comfortTags: string[];
};

export type TripPlan = {
  title: string;
  city: string;
  duration: string;
  estimatedBudget: number;
  travelTime: string;
  walkingLoad: string;
  summary: string;
  selectedPlaceIds: string[];
  stops: RouteStop[];
  scores: OverallScores;
  rejectedCandidates: RejectedCandidate[];
  source: "typhoon" | "fallback";
  setupMessage?: string;
};
