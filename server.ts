import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildRouteFromGeometry,
  computeLocalMatrix,
  computeLocalRoute,
  computeLocalRouteThrough,
  getCachedEnvironment,
  getCachedPlaceDetails,
  resolveLocation,
  routeFareEstimate,
  searchCachedRealPlaces,
  type RouteComputation
} from "./src/data/bangkokGeo";
import {
  buildLocalTripPlan,
  buildTripPlanFromTyphoon,
  createTyphoonPromptPayload,
  extractJsonObject,
  getCandidatePlaces
} from "./src/lib/plannerEngine";
import type { Coordinates, PlannerRequest, RouteGeometry } from "./src/types";

const TYPHOON_BASE_URL = "https://api.opentyphoon.ai/v1";
const TYPHOON_MODEL = "typhoon-v2.5-30b-a3b-instruct";
const OSRM_BASE_URL = "https://router.project-osrm.org";
const routeCache = new Map<string, RouteGeometry>();

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const distDir = join(rootDir, "dist");
const port = Number(process.env.PORT ?? 4173);

const env = {
  typhoonApiKey: process.env.typhoon_api || process.env.TYPHOON_API || process.env.OPENTYPHOON_API_KEY,
  typhoonModel: process.env.TYPHOON_MODEL || TYPHOON_MODEL,
  googleApiKey: process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_API_KEY,
  liveOpenMeteoEnabled: process.env.THAITAI_ENABLE_LIVE_OPEN_METEO !== "false",
  osrmEnabled: process.env.THAITAI_DISABLE_OSRM !== "true"
};
const typhoonEnabled = process.env.THAITAI_ENABLE_TYPHOON === "true" && Boolean(env.typhoonApiKey);
const liveGoogleEnabled = process.env.THAITAI_ENABLE_LIVE_GOOGLE === "true" && Boolean(env.googleApiKey);

createServer(async (req, res) => {
  try {
    const handled = await handleApi(req, res);
    if (!handled) {
      serveStatic(req, res);
    }
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Unexpected server error" });
  }
}).listen(port, () => {
  console.log(`ThaiTAI server listening on http://127.0.0.1:${port}`);
});

async function handleApi(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (url.pathname === "/api/places/search") {
    if (req.method !== "POST") return methodNotAllowed(res);
    const body = await readJsonBody(req);
    const query = typeof body.query === "string" ? body.query : "Bangkok";
    const limit = typeof body.limit === "number" ? body.limit : 8;

    if (liveGoogleEnabled) {
      const googlePlaces = await searchGooglePlaces(query, limit, env.googleApiKey!);
      if (googlePlaces.length) {
        sendJson(res, 200, { places: googlePlaces, source: "google-places" });
        return true;
      }
    }

    sendJson(res, 200, { places: searchCachedRealPlaces(query, limit), source: "cached-real-seed" });
    return true;
  }

  if (url.pathname === "/api/places/details") {
    if (req.method !== "POST") return methodNotAllowed(res);
    const body = await readJsonBody(req);
    const placeId = typeof body.placeId === "string" ? body.placeId : typeof body.id === "string" ? body.id : "";
    const cached = getCachedPlaceDetails(placeId);
    if (cached) {
      sendJson(res, 200, { place: cached, source: "cached-real-seed" });
      return true;
    }

    if (liveGoogleEnabled && placeId) {
      const googlePlace = await getGooglePlaceDetails(placeId, env.googleApiKey!);
      if (googlePlace) {
        sendJson(res, 200, { place: googlePlace, source: "google-places" });
        return true;
      }
    }

    sendJson(res, 404, { error: "Place not found in cached real Bangkok seed list." });
    return true;
  }

  if (url.pathname === "/api/routes/compute") {
    if (req.method !== "POST") return methodNotAllowed(res);
    const body = await readJsonBody(req);
    const waypoints = parseWaypoints(body);
    const fallbackRoute = waypoints.length > 1
      ? computeLocalRouteThrough(waypoints)
      : computeLocalRoute(body.origin, body.destination);
    const osrmProfile = typeof body.profile === "string" ? body.profile : fallbackRoute.distanceMeters < 1800 ? "foot" : "driving";
    const route = env.osrmEnabled
      ? await computeOsrmRoute(waypoints.length > 1 ? waypoints : [body.origin, body.destination], osrmProfile) ?? fallbackRoute
      : liveGoogleEnabled
        ? await computeGoogleRoute(body.origin, body.destination, env.googleApiKey!) ?? fallbackRoute
        : fallbackRoute;

    sendJson(res, 200, { route, fare: routeFareEstimate(route), source: route.source });
    return true;
  }

  if (url.pathname === "/api/routes/matrix") {
    if (req.method !== "POST") return methodNotAllowed(res);
    const body = await readJsonBody(req);
    const origins = Array.isArray(body.origins) ? body.origins : [];
    const destinations = Array.isArray(body.destinations) ? body.destinations : [];
    sendJson(res, 200, { matrix: computeLocalMatrix(origins, destinations), source: "local-haversine" });
    return true;
  }

  if (url.pathname === "/api/environment") {
    if (req.method !== "GET") return methodNotAllowed(res);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");

    if (env.liveOpenMeteoEnabled) {
      const openMeteo = await getOpenMeteoEnvironment(lat, lng);
      if (openMeteo) {
        sendJson(res, 200, openMeteo);
        return true;
      }
    }

    sendJson(res, 200, getCachedEnvironment(lat, lng));
    return true;
  }

  if (url.pathname === "/api/plan-trip") {
    if (req.method !== "POST") return methodNotAllowed(res);
    const request = await readPlannerRequest(req);
    const candidates = getCandidatePlaces(request);

    if (!typhoonEnabled) {
      sendJson(res, 200, buildLocalTripPlan(request, "Live Typhoon planning is disabled; using cached real Bangkok places and local fallback."));
      return true;
    }

    try {
      const typhoonResponse = await fetch(`${TYPHOON_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.typhoonApiKey}`
        },
        body: JSON.stringify({
          model: env.typhoonModel,
          messages: [
            {
              role: "system",
              content: [
                "You are a Bangkok travel route selector.",
                "Return only valid JSON and no markdown.",
                "You must select exactly five places using only IDs from allowedPlaceIds.",
                "Do not invent place IDs, place names, coordinates, or facts.",
                "All allowed candidates are validated real Bangkok seed places."
              ].join(" ")
            },
            {
              role: "user",
              content: JSON.stringify(createTyphoonPromptPayload(request, candidates), null, 2)
            }
          ],
          temperature: 0.2,
          max_tokens: 2200
        })
      });

      if (!typhoonResponse.ok) {
        sendJson(res, 200, buildLocalTripPlan(request, `Typhoon API returned ${typhoonResponse.status}; using deterministic local fallback.`));
        return true;
      }

      const completion = await typhoonResponse.json();
      const content = completion?.choices?.[0]?.message?.content;
      const parsed = typeof content === "string" ? extractJsonObject(content) : null;
      const typhoonPlan = parsed ? buildTripPlanFromTyphoon(request, candidates, parsed) : null;

      sendJson(res, 200, typhoonPlan ?? buildLocalTripPlan(request, "Typhoon response failed route validation; using deterministic local fallback."));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Typhoon request failed";
      sendJson(res, 200, buildLocalTripPlan(request, `${message}; using deterministic local fallback.`));
    }
    return true;
  }

  return false;
}

function serveStatic(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://localhost");
  const requestedPath = decodeURIComponent(url.pathname);
  const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(distDir, safePath === "/" ? "index.html" : safePath);
  const resolvedFile = resolve(filePath);
  const resolvedDist = resolve(distDir);
  const candidate = resolvedFile.startsWith(resolvedDist) && existsSync(resolvedFile) && statSync(resolvedFile).isFile()
    ? resolvedFile
    : join(distDir, "index.html");

  if (!existsSync(candidate)) {
    sendJson(res, 500, { error: "Build output not found. Run npm run build first." });
    return;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", contentType(candidate));
  createReadStream(candidate).pipe(res);
}

function methodNotAllowed(res: ServerResponse) {
  sendJson(res, 405, { error: "Method not allowed" });
  return true;
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const rawBody = await readRawBody(req);
  try {
    const parsed = JSON.parse(rawBody);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

async function readPlannerRequest(req: IncomingMessage): Promise<PlannerRequest> {
  const rawBody = await readRawBody(req);
  try {
    const parsed = JSON.parse(rawBody);
    if (isPlannerRequest(parsed)) return parsed;
  } catch {
    // Fall through to default request.
  }

  return {
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
}

async function readRawBody(req: IncomingMessage): Promise<string> {
  return new Promise<string>((resolveBody) => {
    let body = "";
    req.on("data", (chunk: unknown) => {
      body += String(chunk);
    });
    req.on("end", () => resolveBody(body));
    req.on("error", () => resolveBody(""));
  });
}

function isPlannerRequest(value: unknown): value is PlannerRequest {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const request = value as Partial<PlannerRequest>;
  return typeof request.selected === "object"
    && request.selected !== null
    && typeof request.budget === "string"
    && typeof request.prompt === "string";
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

async function searchGooglePlaces(query: string, limit: number, apiKey: string) {
  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.rating,places.priceLevel,places.currentOpeningHours.openNow,places.types"
      },
      body: JSON.stringify({
        textQuery: `${query} Bangkok Thailand`,
        maxResultCount: Math.min(Math.max(limit, 1), 12),
        locationBias: {
          circle: {
            center: { latitude: 13.7563, longitude: 100.5018 },
            radius: 35000
          }
        }
      })
    });

    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.places) ? data.places.map(normalizeGooglePlace).filter(Boolean) : [];
  } catch {
    return [];
  }
}

async function getGooglePlaceDetails(placeId: string, apiKey: string) {
  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,location,rating,priceLevel,currentOpeningHours.openNow,types"
      }
    });

    if (!response.ok) return null;
    return normalizeGooglePlace(await response.json());
  } catch {
    return null;
  }
}

async function computeGoogleRoute(originInput: unknown, destinationInput: unknown, apiKey: string): Promise<RouteComputation | null> {
  const localRoute = computeLocalRoute(originInput, destinationInput);
  const [origin, destination] = [localRoute.geometry[0], localRoute.geometry[localRoute.geometry.length - 1]];

  try {
    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.staticDuration"
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE"
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    const route = Array.isArray(data.routes) ? data.routes[0] : null;
    if (!route) return null;

    return {
      distanceMeters: typeof route.distanceMeters === "number" ? route.distanceMeters : localRoute.distanceMeters,
      durationSeconds: parseDurationSeconds(route.staticDuration, localRoute.durationSeconds),
      trafficDurationSeconds: parseDurationSeconds(route.duration, localRoute.trafficDurationSeconds),
      geometry: localRoute.geometry,
      legs: localRoute.legs,
      source: "google-routes"
    };
  } catch {
    return null;
  }
}

async function computeOsrmRoute(inputs: unknown[], profile: string): Promise<RouteGeometry | null> {
  const points = inputs.map(resolveLocation);
  if (points.length < 2) return null;

  const osrmProfile = profile === "foot" || profile === "walking" ? "foot" : "driving";
  const key = `${osrmProfile}:${points.map((point) => `${point.lng.toFixed(5)},${point.lat.toFixed(5)}`).join(";")}`;
  const cached = routeCache.get(key);
  if (cached) return cached;

  try {
    const coordinatePath = points.map((point) => `${point.lng},${point.lat}`).join(";");
    const response = await fetch(`${OSRM_BASE_URL}/route/v1/${osrmProfile}/${coordinatePath}?overview=full&geometries=geojson&steps=false`);
    if (!response.ok) return null;

    const data = await response.json();
    const osrmRoute = Array.isArray(data.routes) ? data.routes[0] : null;
    const rawCoordinates = osrmRoute?.geometry?.coordinates;
    if (!Array.isArray(rawCoordinates) || rawCoordinates.length < 2) return null;

    const geometry = rawCoordinates
      .map((item: unknown) => Array.isArray(item) ? { lng: Number(item[0]), lat: Number(item[1]) } : null)
      .filter(isCoordinate);
    if (geometry.length < 2) return null;

    const route = buildRouteFromGeometry(geometry, "osrm-openstreetmap");
    route.distanceMeters = typeof osrmRoute.distance === "number" ? Math.round(osrmRoute.distance) : route.distanceMeters;
    route.durationSeconds = typeof osrmRoute.duration === "number" ? Math.round(osrmRoute.duration) : route.durationSeconds;
    route.trafficDurationSeconds = Math.round(route.durationSeconds * 1.18);
    routeCache.set(key, route);
    return route;
  } catch {
    return null;
  }
}

async function getOpenMeteoEnvironment(lat: string | null, lng: string | null) {
  const latitude = Number(lat ?? 13.7563);
  const longitude = Number(lng ?? 100.5018);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  try {
    const [forecastResponse, airResponse] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1&timezone=auto`),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5`)
    ]);

    if (!forecastResponse.ok || !airResponse.ok) return null;
    const forecast = await forecastResponse.json();
    const air = await airResponse.json();
    const temperatureC = Math.round(Number(forecast.current?.temperature_2m ?? 33));
    const feelsLikeC = Math.round(Number(forecast.current?.apparent_temperature ?? temperatureC));
    const precipitationProbability = nearestHourlyValue(forecast.hourly?.time, forecast.hourly?.precipitation_probability, 24);
    const weatherCode = Math.round(Number(forecast.current?.weather_code ?? 2));
    const condition = conditionForWeatherCode(weatherCode);
    const pm25 = Math.round(Number(air.current?.pm2_5 ?? 30));
    const aqi = Math.round(Number(air.current?.us_aqi ?? pm25));
    const windSpeedKph = Math.round(Number(forecast.current?.wind_speed_10m ?? 8));

    return {
      lat: latitude,
      lng: longitude,
      temperatureC,
      feelsLikeC,
      precipitationProbability,
      aqi,
      aqiLabel: labelForAqi(aqi),
      pm25,
      airQuality: pm25 <= 25 ? "Good" : pm25 <= 37 ? "Moderate" : "Unhealthy",
      condition,
      conditionEmoji: emojiForCondition(condition),
      windSpeedKph,
      weatherRisk: pm25 > 35 || precipitationProbability > 45 ? "High" : pm25 > 25 || precipitationProbability > 30 ? "Medium" : "Low",
      source: "open-meteo"
    };
  } catch {
    return null;
  }
}

function nearestHourlyValue(times: unknown, values: unknown, fallback: number) {
  if (!Array.isArray(times) || !Array.isArray(values) || !times.length || times.length !== values.length) {
    return fallback;
  }

  const now = Date.now();
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  times.forEach((time, index) => {
    const parsed = typeof time === "string" ? Date.parse(time) : Number.NaN;
    const distance = Math.abs(parsed - now);
    if (Number.isFinite(distance) && distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  const value = Number(values[bestIndex]);
  return Number.isFinite(value) ? Math.round(value) : fallback;
}

function labelForAqi(aqi: number) {
  if (aqi <= 50) return "\u0e14\u0e35";
  if (aqi <= 100) return "\u0e1b\u0e32\u0e19\u0e01\u0e25\u0e32\u0e07";
  if (aqi <= 150) return "\u0e40\u0e23\u0e34\u0e48\u0e21\u0e21\u0e35\u0e1c\u0e25";
  return "\u0e44\u0e21\u0e48\u0e14\u0e35";
}

function conditionForWeatherCode(code: number) {
  if ([0, 1].includes(code)) return "Clear sky";
  if ([2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Hazy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Light drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain nearby";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Partly cloudy";
}

function emojiForCondition(condition: string) {
  const normalized = condition.toLowerCase();
  if (normalized.includes("clear") || normalized.includes("sun")) return "☀️";
  if (normalized.includes("cloud")) return "⛅";
  if (normalized.includes("rain") || normalized.includes("drizzle")) return "🌧️";
  if (normalized.includes("thunder")) return "⛈️";
  if (normalized.includes("hazy") || normalized.includes("fog")) return "🌫️";
  return "🌤️";
}

function parseWaypoints(body: Record<string, unknown>) {
  if (!Array.isArray(body.waypoints)) return [];
  return body.waypoints
    .map((item) => {
      if (typeof item === "string") return item;
      if (isCoordinate(item)) return item;
      return null;
    })
    .filter((item): item is string | Coordinates => item !== null);
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

function parseDurationSeconds(value: unknown, fallback: number) {
  if (typeof value !== "string") return fallback;
  const match = value.match(/^(\d+(?:\.\d+)?)s$/);
  return match ? Math.round(Number(match[1])) : fallback;
}

function normalizeGooglePlace(place: any) {
  const lat = Number(place?.location?.latitude);
  const lng = Number(place?.location?.longitude);
  const name = place?.displayName?.text;
  if (!place?.id || typeof name !== "string" || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    id: place.id,
    name,
    kind: Array.isArray(place.types) && place.types.length ? String(place.types[0]).replace(/_/g, " ") : "Place",
    area: "Bangkok",
    coordinates: { lat, lng },
    rating: typeof place.rating === "number" ? place.rating : undefined,
    priceLevel: typeof place.priceLevel === "string" ? place.priceLevel : undefined,
    openNow: typeof place.currentOpeningHours?.openNow === "boolean" ? place.currentOpeningHours.openNow : undefined,
    source: "google-places"
  };
}

function contentType(filePath: string) {
  const types: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon"
  };
  return types[extname(filePath).toLowerCase()] ?? "application/octet-stream";
}
