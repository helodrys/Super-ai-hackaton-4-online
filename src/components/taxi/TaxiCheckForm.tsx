import { type Dispatch, type ReactNode, type SetStateAction, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CarTaxiFront, Clock3, LocateFixed, MapPin, Navigation, Route, Search, ShieldCheck, WalletCards } from "lucide-react";
import { SafeFlowMapPanel } from "../SafeFlowMapPanel";
import type { Coordinates, MapPin as RouteMapPin } from "../../types";

type TaxiRoute = {
  id: string;
  label: string;
  badge: string;
  distance: string;
  duration: string;
  meterPrice: number;
  fees: number;
  total: number;
  comfort: string;
  routeNote: string;
};

type TaxiPlaceOption = {
  id: string;
  name: string;
  kind: string;
  area: string;
  coordinates: Coordinates;
  source: "common-taxi-point" | "cached-real-seed" | "google-places";
};

const taxiRoutes: TaxiRoute[] = [
  {
    id: "direct-meter",
    label: "Direct metered taxi",
    badge: "Live estimate",
    distance: "28.4 km",
    duration: "34-48 min",
    meterPrice: 420,
    fees: 125,
    total: 545,
    comfort: "Best if you have luggage and want the simplest door-to-door route.",
    routeNote: "Airport queue -> Expressway -> Sukhumvit"
  },
  {
    id: "airport-rail",
    label: "Airport Rail Link + short taxi",
    badge: "Cheaper reroute",
    distance: "31.2 km",
    duration: "52-68 min",
    meterPrice: 150,
    fees: 115,
    total: 265,
    comfort: "Lower taxi exposure, better when traffic is heavy near the airport.",
    routeNote: "ARL Makkasan -> short taxi to hotel"
  },
  {
    id: "bts-reroute",
    label: "Taxi to BTS + train",
    badge: "Traffic-aware",
    distance: "24.8 km",
    duration: "45-62 min",
    meterPrice: 210,
    fees: 95,
    total: 305,
    comfort: "Good when central Bangkok is congested but you still want a short car segment.",
    routeNote: "Taxi to On Nut -> BTS to Asok"
  }
];

const commonTaxiPlaces: TaxiPlaceOption[] = [
  { id: "common-suvarnabhumi", name: "Suvarnabhumi Airport", kind: "Airport", area: "Lat Krabang", coordinates: { lat: 13.69, lng: 100.7501 }, source: "common-taxi-point" },
  { id: "common-don-mueang", name: "Don Mueang Airport", kind: "Airport", area: "Don Mueang", coordinates: { lat: 13.9126, lng: 100.6068 }, source: "common-taxi-point" },
  { id: "common-sukhumvit-11", name: "Sukhumvit 11", kind: "Hotel area", area: "Sukhumvit", coordinates: { lat: 13.7422, lng: 100.5577 }, source: "common-taxi-point" },
  { id: "common-asok", name: "Asok BTS / Terminal 21", kind: "Transit area", area: "Asok", coordinates: { lat: 13.7378, lng: 100.5600 }, source: "common-taxi-point" },
  { id: "common-siam", name: "Siam", kind: "Shopping district", area: "Pathum Wan", coordinates: { lat: 13.7465, lng: 100.5348 }, source: "common-taxi-point" },
  { id: "common-chinatown", name: "Chinatown / Yaowarat", kind: "Food district", area: "Yaowarat", coordinates: { lat: 13.7406, lng: 100.5086 }, source: "common-taxi-point" },
  { id: "common-silom", name: "Silom", kind: "Business district", area: "Silom", coordinates: { lat: 13.725, lng: 100.5264 }, source: "common-taxi-point" },
  { id: "common-riverside", name: "Riverside / ICONSIAM", kind: "Riverside area", area: "Thonburi", coordinates: { lat: 13.7265, lng: 100.5104 }, source: "common-taxi-point" }
];

const defaultPickup = commonTaxiPlaces[0];
const defaultDestination = commonTaxiPlaces[2];

const initialTaxiMapPins: RouteMapPin[] = createTaxiPins(defaultPickup.name, defaultDestination.name, defaultPickup.coordinates, defaultDestination.coordinates);

export function TaxiCheckForm() {
  const [pickup, setPickup] = useState(defaultPickup.name);
  const [destination, setDestination] = useState(defaultDestination.name);
  const [pickupOption, setPickupOption] = useState<TaxiPlaceOption | null>(defaultPickup);
  const [destinationOption, setDestinationOption] = useState<TaxiPlaceOption | null>(defaultDestination);
  const [activeSearch, setActiveSearch] = useState<"pickup" | "destination" | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useTaxiPlaceSuggestions(pickup);
  const [destinationSuggestions, setDestinationSuggestions] = useTaxiPlaceSuggestions(destination);
  const [selectedRouteId, setSelectedRouteId] = useState(taxiRoutes[0].id);
  const [hasEstimated, setHasEstimated] = useState(true);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [routeEstimate, setRouteEstimate] = useState<Partial<TaxiRoute> | null>(null);
  const [routeMapPins, setRouteMapPins] = useState<RouteMapPin[]>(initialTaxiMapPins);
  const [estimateSource, setEstimateSource] = useState("Default airport-to-Sukhumvit prediction.");

  const selectedRoute = useMemo(
    () => {
      const route = taxiRoutes.find((item) => item.id === selectedRouteId) ?? taxiRoutes[0];
      return route.id === "direct-meter" && routeEstimate ? { ...route, ...routeEstimate } : route;
    },
    [routeEstimate, selectedRouteId]
  );

  const handleEstimate = async () => {
    const ready = Boolean(pickup.trim() && destination.trim());
    setHasEstimated(ready);
    if (!ready) {
      return;
    }

    setLoadingEstimate(true);
    try {
      const originInput = pickupOption?.coordinates ?? pickup;
      const destinationInput = destinationOption?.coordinates ?? destination;
      const response = await fetch("/api/routes/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: originInput, destination: destinationInput, profile: "driving" })
      });
      const data = await response.json();
      const distanceKm = Number(data?.route?.distanceMeters ?? 0) / 1000;
      const baseMinutes = Math.max(1, Math.round(Number(data?.route?.durationSeconds ?? 0) / 60));
      const trafficMinutes = Math.max(baseMinutes, Math.round(Number(data?.route?.trafficDurationSeconds ?? 0) / 60));
      const fare = data?.fare;
      const geometry = Array.isArray(data?.route?.geometry) ? data.route.geometry.filter(isCoordinate) : [];

      if (distanceKm > 0 && fare) {
        const origin = geometry[0] ?? pickupOption?.coordinates;
        const destinationPoint = geometry[geometry.length - 1] ?? destinationOption?.coordinates;
        setRouteEstimate({
          badge: data?.source === "osrm-openstreetmap" ? "OSM street route" : "Distance model",
          distance: `${distanceKm.toFixed(1)} km`,
          duration: `${baseMinutes}-${trafficMinutes} min`,
          meterPrice: Number(fare.meterPrice ?? taxiRoutes[0].meterPrice),
          fees: Number(fare.fees ?? taxiRoutes[0].fees),
          total: Number(fare.total ?? taxiRoutes[0].total),
          comfort: data?.source === "osrm-openstreetmap"
            ? "Predicted from OpenStreetMap road geometry, traffic buffer, toll assumptions, and SafeFlow fare math."
            : "Predicted from Bangkok coordinate distance, traffic buffer, toll assumptions, and SafeFlow fare math.",
          routeNote: `${pickup} -> ${destination}`
        });
        setEstimateSource(data?.source === "osrm-openstreetmap"
          ? "Prediction uses road distance, potential traffic time, meter fare, and expected route fees."
          : "Prediction uses coordinate distance fallback, potential traffic time, meter fare, and expected route fees.");
        if (origin && destinationPoint) {
          setRouteMapPins(createTaxiPins(pickup, destination, origin, destinationPoint));
        }
        setSelectedRouteId("direct-meter");
      }
    } catch {
      setRouteEstimate(null);
      setEstimateSource("Could not refresh the live route prediction. Showing the last available estimate.");
    } finally {
      setLoadingEstimate(false);
    }
  };

  return (
    <div className="taxi-estimator-layout">
      <motion.section className="taxi-form taxi-route-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="section-heading">
          <span><CarTaxiFront size={15} /> Taxi Price Estimator</span>
          <h1>Estimate the ride before you go</h1>
          <p>Search pickup and destination, choose a matching place, then predict distance, time, and Bangkok taxi fare.</p>
        </div>

        <div className="location-input-stack">
          <TaxiPlaceSearch
            icon={<LocateFixed size={16} />}
            label="Your location"
            placeholder="Search airport, district, hotel area, or attraction"
            value={pickup}
            selectedOption={pickupOption}
            suggestions={pickupSuggestions}
            active={activeSearch === "pickup"}
            onFocus={() => setActiveSearch("pickup")}
            onChange={(value) => {
              setPickup(value);
              setPickupOption(null);
              setActiveSearch("pickup");
              setPickupSuggestions(rankLocalSuggestions(value));
            }}
            onSelect={(option) => {
              setPickup(option.name);
              setPickupOption(option);
              setActiveSearch(null);
            }}
          />

          <TaxiPlaceSearch
            icon={<MapPin size={16} />}
            label="Destination"
            placeholder="Search where you want to go"
            value={destination}
            selectedOption={destinationOption}
            suggestions={destinationSuggestions}
            active={activeSearch === "destination"}
            onFocus={() => setActiveSearch("destination")}
            onChange={(value) => {
              setDestination(value);
              setDestinationOption(null);
              setActiveSearch("destination");
              setDestinationSuggestions(rankLocalSuggestions(value));
            }}
            onSelect={(option) => {
              setDestination(option.name);
              setDestinationOption(option);
              setActiveSearch(null);
            }}
          />
        </div>

        <button type="button" className="primary-pill form-submit" onClick={handleEstimate} disabled={loadingEstimate}>
          <Navigation size={18} /> {loadingEstimate ? "Estimating..." : "Predict price, distance, and time"}
        </button>

        <div className="route-option-list" aria-label="Route recommendations">
          {taxiRoutes.map((route) => (
            <button
              type="button"
              key={route.id}
              className={`route-option-card ${route.id === selectedRoute.id ? "route-option-card-selected" : ""}`}
              onClick={() => {
                setSelectedRouteId(route.id);
                setHasEstimated(Boolean(pickup.trim() && destination.trim()));
              }}
            >
              <span>{route.id === "direct-meter" && routeEstimate?.badge ? routeEstimate.badge : route.badge}</span>
              <strong>{route.label}</strong>
              <small>{route.id === "direct-meter" && routeEstimate?.routeNote ? routeEstimate.routeNote : route.routeNote}</small>
            </button>
          ))}
        </div>
      </motion.section>

      <div className="taxi-output-column">
        <section className="taxi-city-map-panel">
          <div className="taxi-real-map-shell">
            <div className="map-search-pill taxi-real-map-search">
              <MapPin size={16} />
              <span>{pickup || "Your location"} to {destination || "Destination"}</span>
            </div>
            <SafeFlowMapPanel pins={routeMapPins} selectedPin={routeMapPins[0]?.id} variant="bangkok" />
          </div>
        </section>

        <section className="taxi-result price-estimate-card">
          <div className="result-topline">
            <div>
              <span className="panel-label">Prediction output</span>
              <h2>{hasEstimated ? `${pickup || "Pickup"} -> ${destination || "Destination"}` : "Add both locations"}</h2>
            </div>
            <div className="estimate-total">
              <span>Total</span>
              <strong>{hasEstimated ? `${selectedRoute.total} THB` : "--"}</strong>
            </div>
          </div>

          <div className="estimate-metrics">
            <div>
              <Clock3 size={17} />
              <span>{selectedRoute.duration}</span>
            </div>
            <div>
              <Route size={17} />
              <span>{selectedRoute.distance}</span>
            </div>
            <div>
              <WalletCards size={17} />
              <span>Meter {selectedRoute.meterPrice} + fees {selectedRoute.fees}</span>
            </div>
          </div>

          <div className="meter-breakdown">
            <div>
              <span>Predicted meter fare</span>
              <strong>{selectedRoute.meterPrice} THB</strong>
            </div>
            <div>
              <span>Tolls / airport / transit fees</span>
              <strong>{selectedRoute.fees} THB</strong>
            </div>
          </div>

          <p className="taxi-estimate-note">{selectedRoute.id === "direct-meter" ? estimateSource : selectedRoute.comfort}</p>

          <button type="button" className="reroute-recommendation" onClick={() => setSelectedRouteId("airport-rail")}>
            <ShieldCheck size={21} />
            <span>
              <strong>Reroute recommendation</strong>
              <small>{selectedRoute.id === "airport-rail" ? selectedRoute.comfort : "Try Airport Rail Link + short taxi to lower the estimated taxi cost."}</small>
            </span>
          </button>
        </section>
      </div>
    </div>
  );
}

function TaxiPlaceSearch({
  icon,
  label,
  placeholder,
  value,
  selectedOption,
  suggestions,
  active,
  onFocus,
  onChange,
  onSelect
}: {
  icon: ReactNode;
  label: string;
  placeholder: string;
  value: string;
  selectedOption: TaxiPlaceOption | null;
  suggestions: TaxiPlaceOption[];
  active: boolean;
  onFocus: () => void;
  onChange: (value: string) => void;
  onSelect: (option: TaxiPlaceOption) => void;
}) {
  const visibleSuggestions = suggestions.slice(0, 7);

  return (
    <label className="field taxi-place-search">
      <span>{icon} {label}</span>
      <div className="taxi-search-input-wrap">
        <Search size={16} />
        <input
          value={value}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      {selectedOption && (
        <small className="taxi-selected-place">{selectedOption.kind} in {selectedOption.area}</small>
      )}
      {active && visibleSuggestions.length > 0 && (
        <div className="taxi-suggestion-menu" role="listbox">
          {visibleSuggestions.map((option) => (
            <button
              type="button"
              key={option.id}
              className="taxi-suggestion-option"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(option)}
            >
              <span>{option.name}</span>
              <small>{option.kind} - {option.area}</small>
            </button>
          ))}
        </div>
      )}
    </label>
  );
}

function useTaxiPlaceSuggestions(query: string): [TaxiPlaceOption[], Dispatch<SetStateAction<TaxiPlaceOption[]>>] {
  const [suggestions, setSuggestions] = useState<TaxiPlaceOption[]>(rankLocalSuggestions(query));

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const local = rankLocalSuggestions(query);
      if (!query.trim()) {
        setSuggestions(local);
        return;
      }

      try {
        const response = await fetch("/api/places/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, limit: 8 }),
          signal: controller.signal
        });
        const data = await response.json();
        const remote = Array.isArray(data?.places) ? data.places.map(normalizeSearchResult).filter(Boolean) as TaxiPlaceOption[] : [];
        setSuggestions(dedupeSuggestions([...local, ...remote]).slice(0, 10));
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions(local);
        }
      }
    }, 140);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return [suggestions, setSuggestions];
}

function rankLocalSuggestions(query: string) {
  const normalizedQuery = normalize(query);
  const tokens = normalizedQuery.split(" ").filter(Boolean);

  if (!tokens.length) {
    return commonTaxiPlaces;
  }

  return commonTaxiPlaces
    .map((place) => ({ place, score: scoreTaxiSuggestion(place, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name))
    .map((item) => item.place);
}

function scoreTaxiSuggestion(place: TaxiPlaceOption, tokens: string[]) {
  const text = normalize([place.name, place.kind, place.area].join(" "));
  return tokens.reduce((score, token) => {
    if (text.startsWith(token)) return score + 8;
    if (text.includes(token)) return score + 4;
    return score;
  }, 0);
}

function normalizeSearchResult(value: unknown): TaxiPlaceOption | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const item = value as Partial<TaxiPlaceOption>;
  if (
    typeof item.id !== "string"
    || typeof item.name !== "string"
    || typeof item.kind !== "string"
    || typeof item.area !== "string"
    || !isCoordinate(item.coordinates)
  ) {
    return null;
  }
  return {
    id: item.id,
    name: item.name,
    kind: item.kind,
    area: item.area,
    coordinates: item.coordinates,
    source: item.source === "google-places" ? "google-places" : "cached-real-seed"
  };
}

function dedupeSuggestions(suggestions: TaxiPlaceOption[]) {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key = `${normalize(suggestion.name)}:${suggestion.coordinates.lat.toFixed(4)},${suggestion.coordinates.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createTaxiPins(pickup: string, destination: string, origin: Coordinates, destinationPoint: Coordinates): RouteMapPin[] {
  return [
    {
      id: "taxi-pickup",
      label: pickup || "Pickup",
      type: "local",
      x: 18,
      y: 70,
      coordinates: origin,
      note: "Pickup point",
      emoji: "\u{1f44b}"
    },
    {
      id: "taxi-destination",
      label: destination || "Destination",
      type: "recommended",
      x: 78,
      y: 28,
      coordinates: destinationPoint,
      note: "Destination",
      emoji: "\u{1f3c1}"
    }
  ];
}

function normalize(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9\u0E00-\u0E7F]+/g, " ").replace(/\s+/g, " ").trim();
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
