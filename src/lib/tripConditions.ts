import { useEffect, useState } from "react";
import type { Coordinates } from "../types";

export type TripConditionSnapshot = {
  aqi: number;
  aqiLabel: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionEmoji: string;
  rainChance: number;
  pm25: number;
  airQuality: string;
  windSpeed: number;
  source: string;
};

export const DEFAULT_TRIP_CONDITIONS: TripConditionSnapshot = {
  aqi: 42,
  aqiLabel: "\u0e14\u0e35",
  temperature: 29,
  feelsLike: 33,
  condition: "Partly cloudy",
  conditionEmoji: "⛅",
  rainChance: 85,
  pm25: 22,
  airQuality: "Good",
  windSpeed: 8,
  source: "fallback"
};

const REFRESH_INTERVAL_MS = 180_000;
const CACHE_MAX_AGE_MS = 120_000;
const conditionCache = new Map<string, { value: TripConditionSnapshot; fetchedAt: number }>();
const pendingRequests = new Map<string, Promise<TripConditionSnapshot>>();

export function useTripConditions(coordinates?: Coordinates) {
  const [conditions, setConditions] = useState<TripConditionSnapshot>(DEFAULT_TRIP_CONDITIONS);

  useEffect(() => {
    let active = true;

    async function refresh() {
      const next = await fetchTripConditions(coordinates);
      if (active) {
        setConditions(next);
      }
    }

    refresh();
    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [coordinates?.lat, coordinates?.lng]);

  return conditions;
}

export function useLocalTripConditions() {
  const [coordinates, setCoordinates] = useState<Coordinates>();
  const [locationLabel, setLocationLabel] = useState("Bangkok live fallback");
  const conditions = useTripConditions(coordinates);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationLabel("Your location");
      },
      () => setLocationLabel("Bangkok live fallback"),
      { enableHighAccuracy: false, maximumAge: REFRESH_INTERVAL_MS, timeout: 5000 }
    );
  }, []);

  return { ...conditions, locationLabel };
}

export async function fetchTripConditions(coordinates?: Coordinates): Promise<TripConditionSnapshot> {
  const lat = coordinates?.lat ?? 13.7563;
  const lng = coordinates?.lng ?? 100.5018;
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = conditionCache.get(key);

  if (cached && Date.now() - cached.fetchedAt < CACHE_MAX_AGE_MS) {
    return cached.value;
  }

  const pending = pendingRequests.get(key);
  if (pending) {
    return pending;
  }

  const request = fetch(`/api/environment?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Environment API returned ${response.status}`);
      }
      return toTripConditions(await response.json());
    })
    .catch(() => DEFAULT_TRIP_CONDITIONS)
    .then((value) => {
      conditionCache.set(key, { value, fetchedAt: Date.now() });
      pendingRequests.delete(key);
      return value;
    });

  pendingRequests.set(key, request);
  return request;
}

function toTripConditions(value: unknown): TripConditionSnapshot {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return DEFAULT_TRIP_CONDITIONS;
  }

  const data = value as Record<string, unknown>;
  const aqi = finiteNumber(data.aqi ?? data.usAqi ?? data.pm25, DEFAULT_TRIP_CONDITIONS.aqi);
  const rainChance = finiteNumber(data.precipitationProbability ?? data.rainChance, DEFAULT_TRIP_CONDITIONS.rainChance);
  const condition = typeof data.condition === "string" && data.condition.trim()
    ? data.condition.trim()
    : rainChance >= 60
      ? "Rain likely"
      : "Partly cloudy";

  return {
    aqi,
    aqiLabel: typeof data.aqiLabel === "string" && data.aqiLabel.trim() ? data.aqiLabel.trim() : labelForAqi(aqi),
    temperature: finiteNumber(data.temperatureC ?? data.temperature, DEFAULT_TRIP_CONDITIONS.temperature),
    feelsLike: finiteNumber(data.feelsLikeC ?? data.feelsLike, DEFAULT_TRIP_CONDITIONS.feelsLike),
    condition,
    conditionEmoji: typeof data.conditionEmoji === "string" && data.conditionEmoji.trim() ? data.conditionEmoji.trim() : emojiForCondition(condition),
    rainChance,
    pm25: finiteNumber(data.pm25, DEFAULT_TRIP_CONDITIONS.pm25),
    airQuality: typeof data.airQuality === "string" && data.airQuality.trim() ? data.airQuality.trim() : DEFAULT_TRIP_CONDITIONS.airQuality,
    windSpeed: finiteNumber(data.windSpeedKph ?? data.windSpeed, DEFAULT_TRIP_CONDITIONS.windSpeed),
    source: typeof data.source === "string" && data.source.trim() ? data.source.trim() : DEFAULT_TRIP_CONDITIONS.source
  };
}

function finiteNumber(value: unknown, fallback: number) {
  const numberValue = typeof value === "string" ? Number(value) : value;
  return typeof numberValue === "number" && Number.isFinite(numberValue) ? Math.round(numberValue) : fallback;
}

function labelForAqi(aqi: number) {
  if (aqi <= 50) return "\u0e14\u0e35";
  if (aqi <= 100) return "\u0e1b\u0e32\u0e19\u0e01\u0e25\u0e32\u0e07";
  if (aqi <= 150) return "\u0e40\u0e23\u0e34\u0e48\u0e21\u0e21\u0e35\u0e1c\u0e25";
  return "\u0e44\u0e21\u0e48\u0e14\u0e35";
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
