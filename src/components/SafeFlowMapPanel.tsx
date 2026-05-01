import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type LngLatBoundsLike, type Map, type Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ChevronUp, MapPinned, ShieldAlert, Wind } from "lucide-react";
import type { Coordinates, MapPin, RouteLeg, RouteStop } from "../types";

type SafeFlowMapPanelProps = {
  pins: MapPin[];
  selectedPin?: string;
  compact?: boolean;
  variant?: "default" | "bangkok";
  previewCoordinates?: Coordinates[];
  stops?: RouteStop[];
};

const BANGKOK_CENTER: Coordinates = { lat: 13.7563, lng: 100.5018 };
const OPENFREEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export function SafeFlowMapPanel({ pins, selectedPin, compact = false, variant = "default", previewCoordinates = [], stops = [] }: SafeFlowMapPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRefs = useRef<Marker[]>([]);
  const [activePinId, setActivePinId] = useState(selectedPin ?? pins[0]?.id);
  const [mapReady, setMapReady] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [trayCollapsed, setTrayCollapsed] = useState(true);
  const routeCoordinates = useMemo(() => pins.map((pin) => pin.coordinates ?? projectPin(pin)).filter(Boolean), [pins]);
  const routeKey = useMemo(() => routeCoordinates.map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join("|"), [routeCoordinates]);
  const [streetRouteCoordinates, setStreetRouteCoordinates] = useState<Coordinates[]>(routeCoordinates);
  const [routeLegs, setRouteLegs] = useState<RouteLeg[]>([]);
  const [routeSourceLabel, setRouteSourceLabel] = useState("OpenStreetMap route");
  const activeIndex = Math.max(0, pins.findIndex((pin) => pin.id === activePinId));
  const activePin = pins[activeIndex] ?? pins[0];
  const activeStop = stops[activeIndex];

  useEffect(() => {
    setActivePinId(selectedPin ?? pins[0]?.id);
  }, [pins, selectedPin]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyle(),
      center: [BANGKOK_CENTER.lng, BANGKOK_CENTER.lat],
      zoom: variant === "bangkok" ? 11.2 : 10.8,
      attributionControl: false,
      interactive: true,
      pitch: 28,
      bearing: -14
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.once("load", () => {
      ensureRouteLayers(map);
      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [variant]);

  useEffect(() => {
    if (routeCoordinates.length < 2) {
      setStreetRouteCoordinates(routeCoordinates);
      setRouteLegs([]);
      return;
    }

    const controller = new AbortController();
    setStreetRouteCoordinates(routeCoordinates);
    setRouteSourceLabel("Loading road route...");

    fetch("/api/routes/compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waypoints: routeCoordinates, profile: "driving" }),
      signal: controller.signal
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        const geometry = Array.isArray(data?.route?.geometry) ? data.route.geometry.filter(isCoordinate) : [];
        if (geometry.length >= 2) {
          setStreetRouteCoordinates(geometry);
          setRouteLegs(Array.isArray(data?.route?.legs) ? data.route.legs.filter(isRouteLeg) : []);
          setRouteSourceLabel(data?.route?.source === "osrm-openstreetmap" ? "OpenStreetMap road route" : "Fallback route");
        } else {
          setStreetRouteCoordinates(routeCoordinates);
          setRouteLegs(createLocalLegs(routeCoordinates));
          setRouteSourceLabel("Fallback route");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setStreetRouteCoordinates(routeCoordinates);
          setRouteLegs(createLocalLegs(routeCoordinates));
          setRouteSourceLabel("Fallback route");
        }
      });

    return () => controller.abort();
  }, [routeKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    syncRoute(map, streetRouteCoordinates);
    syncPreview(map, previewCoordinates);
    fitRoute(map, streetRouteCoordinates.length ? streetRouteCoordinates : routeCoordinates, compact);
  }, [compact, mapReady, previewCoordinates, routeCoordinates, streetRouteCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = pins.map((pin, index) => {
      const coordinates = pin.coordinates ?? projectPin(pin);
      const element = document.createElement("button");
      element.type = "button";
      element.className = `safeflow-map-marker safeflow-map-marker-${pin.type} ${activePinId === pin.id ? "safeflow-map-marker-active" : ""}`;
      element.setAttribute("aria-label", `${pin.label}: ${pin.note}`);
      const icon = document.createElement("span");
      icon.className = "safeflow-map-marker-icon";
      icon.textContent = pin.emoji ?? emojiForPin(pin);
      const order = document.createElement("b");
      order.className = "safeflow-map-marker-order";
      order.textContent = String(index + 1);
      element.append(icon, order);
      element.addEventListener("mouseenter", () => setActivePinId(pin.id));
      element.addEventListener("click", () => {
        setActivePinId(pin.id);
        setTrayCollapsed(false);
        setSheetExpanded(true);
        map.easeTo({ center: [coordinates.lng, coordinates.lat], zoom: Math.max(map.getZoom(), 12.8), duration: 650 });
      });

      return new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(map);
    });
  }, [activePinId, mapReady, pins]);

  return (
    <section
      className={`safeflow-map ${compact ? "safeflow-map-compact" : ""} ${variant === "bangkok" ? "safeflow-map-bangkok" : ""}`}
      aria-label="SafeFlow Bangkok route map"
    >
      <div ref={containerRef} className="safeflow-map-canvas" />
      <div className="map-badge safeflow-map-badge"><MapPinned size={16} /> {routeSourceLabel}</div>
      <div className="safeflow-map-status-stack">
        <button
          type="button"
          className="safeflow-map-collapse-toggle"
          aria-expanded={!trayCollapsed}
          onClick={() => setTrayCollapsed((collapsed) => !collapsed)}
        >
          <ChevronUp size={16} />
          {trayCollapsed ? "Show route details" : "Hide route details"}
        </button>
        <div className="safeflow-map-warning"><Wind size={15} /> PM2.5 watch</div>
        <div className="safeflow-map-reroute"><ShieldAlert size={15} /> Indoor fallback ready</div>
      </div>
      <div className={`safeflow-map-tray ${sheetExpanded ? "safeflow-map-tray-expanded" : ""} ${trayCollapsed ? "safeflow-map-tray-collapsed" : ""}`} aria-live="polite">
        <button
          type="button"
          className="safeflow-sheet-handle"
          aria-label={sheetExpanded ? "Collapse route sheet" : "Expand route sheet"}
          onClick={() => setSheetExpanded((expanded) => !expanded)}
        />
        <div className="safeflow-route-summary">
          <span>{pins.length} stops</span>
          <strong>{formatRouteDistance(routeLegs)} route</strong>
          <em>{formatRouteDuration(routeLegs)}</em>
        </div>
        {activePin && (
          <article className="safeflow-stop-card" aria-label="Selected stop">
            <div className="safeflow-stop-card-topline">
              <span className="safeflow-stop-card-icon">{activePin.emoji ?? emojiForPin(activePin)}</span>
              <div>
                <span>{activeStop ? `${activeStop.time} - ${activeStop.type} - ${activeStop.score}/100 fit` : activePin.type}</span>
                <strong>{activePin.label}</strong>
              </div>
            </div>
            <p>{activePin.note}</p>
            {activeStop && (
              <>
                <div className="safeflow-stop-card-tags">
                  {activeStop.tags.slice(0, 4).map((tag) => <em key={tag}>{tag}</em>)}
                </div>
                <RouteTimelineRail stops={stops} activeIndex={activeIndex} legs={routeLegs} />
              </>
            )}
          </article>
        )}
        <div className="safeflow-stop-strip" aria-label="Route stops">
          {pins.map((pin, index) => (
            <button
              type="button"
              key={pin.id}
              className={activePinId === pin.id ? "safeflow-stop-chip safeflow-stop-chip-active" : "safeflow-stop-chip"}
              onMouseEnter={() => setActivePinId(pin.id)}
              onClick={() => {
                setTrayCollapsed(false);
                setSheetExpanded(true);
                focusPin(pin);
              }}
            >
              <span>{pin.emoji ?? emojiForPin(pin)}</span>
              <em>{index + 1}. {pin.label}</em>
            </button>
          ))}
        </div>
      </div>
    </section>
  );

  function focusPin(pin: MapPin) {
    const map = mapRef.current;
    const coordinates = pin.coordinates ?? projectPin(pin);
    setActivePinId(pin.id);
    setTrayCollapsed(false);
    map?.easeTo({ center: [coordinates.lng, coordinates.lat], zoom: Math.max(map.getZoom(), 12.8), duration: 650 });
  }
}

function RouteTimelineRail({ stops, activeIndex, legs }: { stops: RouteStop[]; activeIndex: number; legs: RouteLeg[] }) {
  const activeStop = stops[activeIndex];
  const nextStop = stops[activeIndex + 1];
  const previousLeg = activeIndex > 0 ? legs[activeIndex - 1] : undefined;
  const nextLeg = legs[activeIndex];

  if (!activeStop) {
    return null;
  }

  return (
    <div className="safeflow-route-rail" aria-label="Selected route timeline">
      {previousLeg && (
        <div className="safeflow-route-rail-leg">
          <span>{activeIndex} -&gt; {activeIndex + 1}</span>
          <strong>{formatLeg(previousLeg)}</strong>
        </div>
      )}
      <div className="safeflow-route-rail-stop">
        <span>{activeIndex + 1}</span>
        <div>
          <strong>{activeStop.name}</strong>
          <p>{activeStop.vibeMatch}</p>
        </div>
      </div>
      {nextStop && (
        <>
          <div className="safeflow-route-rail-leg">
            <span>{activeIndex + 1} -&gt; {activeIndex + 2}</span>
            <strong>{nextLeg ? formatLeg(nextLeg) : "Distance pending"}</strong>
          </div>
          <div className="safeflow-route-rail-next">
            <span>Next</span>
            <div>
              <strong>{nextStop.name}</strong>
              <p>{nextStop.reason}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getMapStyle(): string {
  const mapStyleUrl = import.meta.env.VITE_MAP_STYLE_URL;
  const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY;
  const allowExternalTiles = import.meta.env.VITE_ENABLE_EXTERNAL_TILES === "true";
  if (typeof mapStyleUrl === "string" && mapStyleUrl.trim()) {
    return mapStyleUrl;
  }
  if (allowExternalTiles && mapTilerKey) {
    return `https://api.maptiler.com/maps/dataviz/style.json?key=${mapTilerKey}`;
  }

  return OPENFREEMAP_STYLE_URL;
}

function ensureRouteLayers(map: Map) {
  if (!map.getSource("route")) {
    map.addSource("route", { type: "geojson", data: emptyRoute() });
  }
  if (!map.getSource("preview-route")) {
    map.addSource("preview-route", { type: "geojson", data: emptyRoute() });
  }
  if (!map.getLayer("route-glow")) {
    map.addLayer({ id: "route-glow", type: "line", source: "route", paint: { "line-color": "#0f766e", "line-width": 9, "line-blur": 5, "line-opacity": 0.18 } });
  }
  if (!map.getLayer("route-line")) {
    map.addLayer({ id: "route-line", type: "line", source: "route", paint: { "line-color": "#0f766e", "line-width": 5.4, "line-opacity": 0.98 } });
  }
  if (!map.getLayer("preview-route-line")) {
    map.addLayer({
      id: "preview-route-line",
      type: "line",
      source: "preview-route",
      paint: {
        "line-color": "#f97316",
        "line-width": 2.8,
        "line-dasharray": [1.1, 1.4],
        "line-opacity": 0.66
      }
    });
  }
}

function syncRoute(map: Map, coordinates: Coordinates[]) {
  const source = map.getSource("route") as GeoJSONSource | undefined;
  const data = coordinates.length >= 2 ? line(coordinates.map((point) => [point.lng, point.lat])) : emptyRoute();
  source?.setData(data);
}

function syncPreview(map: Map, coordinates: Coordinates[]) {
  const source = map.getSource("preview-route") as GeoJSONSource | undefined;
  const data = coordinates.length >= 2 ? line(coordinates.map((point) => [point.lng, point.lat])) : emptyRoute();
  source?.setData(data);
}

function fitRoute(map: Map, coordinates: Coordinates[], compact: boolean) {
  if (!coordinates.length) {
    return;
  }

  const bounds = coordinates.reduce((nextBounds, point) => nextBounds.extend([point.lng, point.lat]), new maplibregl.LngLatBounds(
    [coordinates[0].lng, coordinates[0].lat],
    [coordinates[0].lng, coordinates[0].lat]
  ));

  map.fitBounds(bounds as LngLatBoundsLike, {
    padding: compact ? 72 : { top: 96, right: 84, bottom: 210, left: 84 },
    maxZoom: 13.4,
    duration: 850
  });
}

function formatLeg(leg: RouteLeg) {
  return `${(leg.distanceMeters / 1000).toFixed(1)} km - ${Math.max(1, Math.round(leg.durationSeconds / 60))} min`;
}

function formatRouteDistance(legs: RouteLeg[]) {
  const distance = legs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
  return distance ? `${(distance / 1000).toFixed(1)} km` : "Local";
}

function formatRouteDuration(legs: RouteLeg[]) {
  const seconds = legs.reduce((sum, leg) => sum + leg.durationSeconds, 0);
  return seconds ? `${Math.max(1, Math.round(seconds / 60))} min transfers` : "distance fallback ready";
}

function createLocalLegs(coordinates: Coordinates[]): RouteLeg[] {
  return coordinates.slice(0, -1).map((from, index) => {
    const to = coordinates[index + 1];
    const distanceMeters = Math.round(haversineKm(from, to) * 1000);
    const durationSeconds = Math.max(120, Math.round(distanceMeters / 9));
    return {
      from,
      to,
      distanceMeters,
      durationSeconds,
      geometry: [from, to]
    };
  });
}

function haversineKm(a: Coordinates, b: Coordinates) {
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

function emojiForPin(pin: MapPin) {
  const emojiByType: Record<MapPin["type"], string> = {
    risk: "\u26a0\ufe0f",
    recommended: "\u{1f4cd}",
    local: "\u{1f9ed}",
    food: "\u{1f35c}",
    culture: "\u{1f3db}\ufe0f"
  };
  return emojiByType[pin.type];
}

function projectPin(pin: MapPin): Coordinates {
  return {
    lat: 13.86 - (pin.y / 100) * 0.19,
    lng: 100.47 + (pin.x / 100) * 0.12
  };
}

function emptyRoute() {
  return line([]);
}

function line(coordinates: number[][]) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates
    }
  };
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

function isRouteLeg(value: unknown): value is RouteLeg {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && isCoordinate((value as RouteLeg).from)
    && isCoordinate((value as RouteLeg).to)
    && typeof (value as RouteLeg).distanceMeters === "number"
    && typeof (value as RouteLeg).durationSeconds === "number"
    && Array.isArray((value as RouteLeg).geometry);
}
