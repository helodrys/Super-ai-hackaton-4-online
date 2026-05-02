import { useEffect, useState } from "react";
import type { Coordinates } from "../types";

export type TripConditionSnapshot = {
  aqi: number;
  aqiLabel: string;
  temperature: number;
  condition: string;
  rainChance: number;
};

export const DEFAULT_TRIP_CONDITIONS: TripConditionSnapshot = {
  aqi: 42,
  aqiLabel: "ดี",
  temperature: 29,
  condition: "Partly cloudy",
  rainChance: 85
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
    condition,
    rainChance
  };
}

function finiteNumber(value: unknown, fallback: number) {
  const numberValue = typeof value === "string" ? Number(value) : value;
  return typeof numberValue === "number" && Number.isFinite(numberValue) ? Math.round(numberValue) : fallback;
}

function labelForAqi(aqi: number) {
  if (aqi <= 50) return "ดี";
  if (aqi <= 100) return "ปานกลาง";
  if (aqi <= 150) return "เริ่มมีผล";
  return "ไม่ดี";
}
