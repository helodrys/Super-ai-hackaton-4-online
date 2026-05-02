import { places } from "./places";
import type { Coordinates, Place, RouteGeometry, RouteLeg } from "../types";

export type NormalizedPlace = {
  id: string;
  name: string;
  kind: string;
  area: string;
  coordinates: Coordinates;
  rating?: number;
  priceLevel?: string;
  openNow?: boolean;
  source: "cached-real-seed" | "google-places";
};

export type RouteComputation = RouteGeometry;

export type EnvironmentSnapshot = {
  lat: number;
  lng: number;
  temperatureC: number;
  feelsLikeC: number;
  precipitationProbability: number;
  aqi: number;
  aqiLabel: string;
  pm25: number;
  airQuality: "Good" | "Moderate" | "Unhealthy";
  condition: string;
  conditionEmoji: string;
  windSpeedKph: number;
  weatherRisk: "Low" | "Medium" | "High";
  source: "cached-bangkok-profile" | "open-meteo";
};

export const BANGKOK_CENTER: Coordinates = { lat: 13.7563, lng: 100.5018 };

const REAL_PLACE_COORDINATES: Record<string, Coordinates> = {
  "wat-ratchanatdaram": { lat: 13.7564, lng: 100.5040 },
  "museum-siam": { lat: 13.7438, lng: 100.4947 },
  "pak-khlong-flower-market": { lat: 13.7414, lng: 100.4959 },
  "wat-pho": { lat: 13.7465, lng: 100.4930 },
  "wat-arun-riverside": { lat: 13.7437, lng: 100.4889 },
  "bangkok-national-museum": { lat: 13.7577, lng: 100.4926 },
  "jim-thompson-house": { lat: 13.7492, lng: 100.5284 },
  "bangkok-art-culture-centre": { lat: 13.7467, lng: 100.5300 },
  "siam-paragon-food-hall": { lat: 13.7462, lng: 100.5350 },
  "suan-pakkad-palace": { lat: 13.7562, lng: 100.5365 },
  "or-tor-kor-market": { lat: 13.7985, lng: 100.5488 },
  "chatuchak-weekend-market": { lat: 13.7996, lng: 100.5500 },
  "lumpini-park-shade-loop": { lat: 13.7307, lng: 100.5418 },
  "warehouse-30": { lat: 13.7295, lng: 100.5133 },
  "icon-siam-river-terrace": { lat: 13.7265, lng: 100.5104 },
  "asok-terminal-21-food-court": { lat: 13.7378, lng: 100.5600 },
  "benjakitti-forest-park": { lat: 13.7303, lng: 100.5588 },
  "emquartier-sky-garden": { lat: 13.7300, lng: 100.5696 },
  "khlong-toei-market": { lat: 13.7154, lng: 100.5584 },
  "queen-sirikit-gallery": { lat: 13.7553, lng: 100.5069 },
  "yaowarat-evening-snacks": { lat: 13.7406, lng: 100.5086 },
  "talat-noi-street-art": { lat: 13.7347, lng: 100.5130 },
  "moca-bangkok": { lat: 13.8550, lng: 100.5813 },
  "bangkok-butterfly-garden": { lat: 13.8122, lng: 100.5531 },
  "bang-krachao-bike-loop": { lat: 13.6834, lng: 100.5634 },
  "pratunam-fashion-market": { lat: 13.7526, lng: 100.5418 },
  "platinum-mall-rest-stop": { lat: 13.7501, lng: 100.5403 },
  "eathai-central-embassy": { lat: 13.7430, lng: 100.5468 },
  "kudi-chin-community-walk": { lat: 13.7375, lng: 100.4918 },
  "boat-noodle-victory": { lat: 13.7636, lng: 100.5382 },
  "grand-palace-outer-view": { lat: 13.7500, lng: 100.4913 },
  "bangkokian-museum": { lat: 13.7245, lng: 100.5186 },
  "mahanakhon-viewpoint": { lat: 13.7234, lng: 100.5280 }
};

const KNOWN_LOCATIONS: Record<string, Coordinates> = {
  "suvarnabhumi airport": { lat: 13.6900, lng: 100.7501 },
  "bangkok airport": { lat: 13.6900, lng: 100.7501 },
  "don mueang airport": { lat: 13.9126, lng: 100.6068 },
  "sukhumvit 11": { lat: 13.7422, lng: 100.5577 },
  "asok": { lat: 13.7378, lng: 100.5600 },
  "siam": { lat: 13.7465, lng: 100.5348 },
  "old town": { lat: 13.7525, lng: 100.4942 },
  "chinatown": { lat: 13.7406, lng: 100.5086 },
  "silom": { lat: 13.7250, lng: 100.5264 },
  "riverside": { lat: 13.7265, lng: 100.5104 }
};

export function getPlaceCoordinates(place: Place): Coordinates {
  return REAL_PLACE_COORDINATES[place.id] ?? projectMockCoordinate(place.mockCoordinates.x, place.mockCoordinates.y);
}

export function normalizePlace(place: Place, source: NormalizedPlace["source"] = "cached-real-seed"): NormalizedPlace {
  return {
    id: place.id,
    name: place.name,
    kind: place.kind,
    area: place.area,
    coordinates: getPlaceCoordinates(place),
    openNow: true,
    priceLevel: place.budgetLevel,
    source
  };
}

export function searchCachedRealPlaces(query = "", limit = 8): NormalizedPlace[] {
  const normalizedQuery = normalize(query);
  const tokens = normalizedQuery.split(" ").filter(Boolean);

  return places
    .filter((place) => place.realness === "real")
    .map((place) => ({
      place,
      score: scoreSearchResult(place, tokens)
    }))
    .filter((item) => !tokens.length || item.score > 0)
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name))
    .slice(0, limit)
    .map((item) => normalizePlace(item.place));
}

export function getCachedPlaceDetails(id: string): NormalizedPlace | null {
  const place = places.find((candidate) => candidate.id === id && candidate.realness === "real");
  return place ? normalizePlace(place) : null;
}

export function resolveLocation(input: unknown): Coordinates {
  if (isCoordinates(input)) {
    return input;
  }

  const text = typeof input === "string" ? normalize(input) : "";
  if (!text) {
    return BANGKOK_CENTER;
  }

  const direct = KNOWN_LOCATIONS[text];
  if (direct) {
    return direct;
  }

  const place = places.find((candidate) => candidate.id === text || normalize(candidate.name) === text || text.includes(normalize(candidate.name)));
  if (place) {
    return getPlaceCoordinates(place);
  }

  const knownEntry = Object.entries(KNOWN_LOCATIONS).find(([key]) => text.includes(key) || key.includes(text));
  if (knownEntry) {
    return knownEntry[1];
  }

  return BANGKOK_CENTER;
}

export function computeLocalRoute(originInput: unknown, destinationInput: unknown): RouteComputation {
  return computeLocalRouteThrough([originInput, destinationInput]);
}

export function computeLocalRouteThrough(inputs: unknown[]): RouteComputation {
  const points = inputs.map(resolveLocation).filter(isValidCoordinate);
  const waypoints = points.length >= 2 ? points : [BANGKOK_CENTER, { lat: 13.7422, lng: 100.5577 }];
  const legs: RouteLeg[] = [];
  const geometry: Coordinates[] = [];

  for (let index = 0; index < waypoints.length - 1; index += 1) {
    const origin = waypoints[index];
    const destination = waypoints[index + 1];
    const distanceMeters = Math.round(haversineMeters(origin, destination) * 1.22);
    const durationSeconds = Math.max(420, Math.round((distanceMeters / 1000 / 24) * 3600));
    const legGeometry = [origin, midpoint(origin, destination), destination];
    legs.push({ from: origin, to: destination, distanceMeters, durationSeconds, geometry: legGeometry });
    geometry.push(...(index === 0 ? legGeometry : legGeometry.slice(1)));
  }

  const distanceMeters = legs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
  const durationSeconds = legs.reduce((sum, leg) => sum + leg.durationSeconds, 0);
  return {
    distanceMeters,
    durationSeconds,
    trafficDurationSeconds: Math.round(durationSeconds * trafficMultiplier(distanceMeters)),
    geometry,
    legs,
    source: "local-haversine"
  };
}

export function buildRouteFromGeometry(points: Coordinates[], source: RouteGeometry["source"]): RouteGeometry {
  const waypoints = points.filter(isValidCoordinate);
  if (waypoints.length < 2) {
    return computeLocalRouteThrough(waypoints);
  }

  const legs = waypoints.slice(0, -1).map((origin, index) => {
    const destination = waypoints[index + 1];
    const distanceMeters = Math.round(haversineMeters(origin, destination) * 1.18);
    const durationSeconds = Math.max(300, Math.round((distanceMeters / 1000 / 26) * 3600));
    return {
      from: origin,
      to: destination,
      distanceMeters,
      durationSeconds,
      geometry: index === 0 ? waypoints : [origin, destination]
    };
  });

  const distanceMeters = legs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
  const durationSeconds = legs.reduce((sum, leg) => sum + leg.durationSeconds, 0);
  return {
    distanceMeters,
    durationSeconds,
    trafficDurationSeconds: Math.round(durationSeconds * trafficMultiplier(distanceMeters)),
    geometry: waypoints,
    legs,
    source
  };
}

export function computeFallbackLineRoute(originInput: unknown, destinationInput: unknown): RouteComputation {
  const origin = resolveLocation(originInput);
  const destination = resolveLocation(destinationInput);
  const distanceMeters = Math.round(haversineMeters(origin, destination) * 1.18);
  const durationSeconds = Math.max(420, Math.round((distanceMeters / 1000 / 24) * 3600));
  const trafficDurationSeconds = Math.round(durationSeconds * trafficMultiplier(distanceMeters));
  const geometry = [origin, midpoint(origin, destination), destination];

  return {
    distanceMeters,
    durationSeconds,
    trafficDurationSeconds,
    geometry,
    legs: [{ from: origin, to: destination, distanceMeters, durationSeconds, geometry }],
    source: "fallback-line"
  };
}

export function computeLocalMatrix(origins: unknown[], destinations: unknown[]) {
  return origins.map((origin, originIndex) => ({
    originIndex,
    destinations: destinations.map((destination, destinationIndex) => ({
      destinationIndex,
      ...computeLocalRoute(origin, destination)
    }))
  }));
}

export function getCachedEnvironment(latInput: unknown, lngInput: unknown): EnvironmentSnapshot {
  const lat = toFiniteNumber(latInput, BANGKOK_CENTER.lat);
  const lng = toFiniteNumber(lngInput, BANGKOK_CENTER.lng);
  const centralFriction = Math.max(0, 1 - Math.min(1, haversineMeters({ lat, lng }, BANGKOK_CENTER) / 18000));
  const pm25 = Math.round(22 + centralFriction * 13);
  const rain = Math.round(18 + Math.max(0, lat - 13.74) * 90);

  return {
    lat,
    lng,
    temperatureC: 33,
    feelsLikeC: 38,
    precipitationProbability: Math.min(52, rain),
    aqi: pm25,
    aqiLabel: pm25 <= 25 ? "ดี" : pm25 <= 37 ? "ปานกลาง" : "เริ่มมีผล",
    pm25,
    airQuality: pm25 <= 25 ? "Good" : pm25 <= 37 ? "Moderate" : "Unhealthy",
    condition: rain > 45 ? "Rain nearby" : "Partly cloudy",
    conditionEmoji: rain > 45 ? "🌧️" : "⛅",
    windSpeedKph: Math.round(7 + centralFriction * 5),
    weatherRisk: pm25 > 35 || rain > 45 ? "High" : pm25 > 25 || rain > 30 ? "Medium" : "Low",
    source: "cached-bangkok-profile"
  };
}

export function routeFareEstimate(route: RouteComputation) {
  const km = route.distanceMeters / 1000;
  const baseFare = 35;
  const distanceFare = km <= 1 ? 0 : (Math.min(km, 10) - 1) * 6.5 + Math.max(0, km - 10) * 10.5;
  const trafficSurcharge = Math.max(0, (route.trafficDurationSeconds - route.durationSeconds) / 60) * 2;
  const tollEstimate = km > 18 ? 75 : km > 10 ? 45 : 0;
  const meterPrice = Math.round(baseFare + distanceFare + trafficSurcharge);

  return {
    meterPrice,
    fees: tollEstimate,
    total: meterPrice + tollEstimate,
    risk: km > 25 || trafficSurcharge > 70 ? "Medium" : "Low"
  };
}

function scoreSearchResult(place: Place, tokens: string[]) {
  if (!tokens.length) {
    return place.crowdLevel === "low" ? 3 : 2;
  }

  const haystack = normalize([
    place.name,
    place.kind,
    place.area,
    place.description,
    ...place.vibes,
    ...place.foodTags
  ].join(" "));

  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function projectMockCoordinate(x: number, y: number): Coordinates {
  return {
    lat: 13.86 - (y / 100) * 0.19,
    lng: 100.47 + (x / 100) * 0.12
  };
}

function haversineMeters(a: Coordinates, b: Coordinates) {
  const earthRadius = 6371000;
  const dLat = degreesToRadians(b.lat - a.lat);
  const dLng = degreesToRadians(b.lng - a.lng);
  const lat1 = degreesToRadians(a.lat);
  const lat2 = degreesToRadians(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function midpoint(a: Coordinates, b: Coordinates): Coordinates {
  return {
    lat: (a.lat + b.lat) / 2 + 0.006,
    lng: (a.lng + b.lng) / 2 - 0.004
  };
}

function trafficMultiplier(distanceMeters: number) {
  if (distanceMeters > 25000) return 1.42;
  if (distanceMeters > 12000) return 1.3;
  return 1.18;
}

function degreesToRadians(value: number) {
  return value * Math.PI / 180;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9\u0E00-\u0E7F]+/g, " ").replace(/\s+/g, " ").trim();
}

function isCoordinates(value: unknown): value is Coordinates {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && typeof (value as Coordinates).lat === "number"
    && typeof (value as Coordinates).lng === "number";
}

function isValidCoordinate(value: Coordinates) {
  return Number.isFinite(value.lat)
    && Number.isFinite(value.lng)
    && Math.abs(value.lat) <= 90
    && Math.abs(value.lng) <= 180;
}

function toFiniteNumber(value: unknown, fallback: number) {
  const numberValue = typeof value === "string" ? Number(value) : value;
  return typeof numberValue === "number" && Number.isFinite(numberValue) ? numberValue : fallback;
}
