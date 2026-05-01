import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CarTaxiFront, Clock3, LocateFixed, MapPin, Navigation, Route, ShieldCheck, WalletCards } from "lucide-react";
import { SafeFlowMapPanel } from "../SafeFlowMapPanel";
import type { Coordinates, MapPin as RouteMapPin } from "../../types";

const taxiRoutes = [
  {
    id: "direct-meter",
    label: "Direct metered taxi",
    badge: "MVP estimate",
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

const initialTaxiMapPins: RouteMapPin[] = [
  {
    id: "taxi-pickup",
    label: "Suvarnabhumi Airport",
    type: "local",
    x: 19,
    y: 70,
    coordinates: { lat: 13.69, lng: 100.7501 },
    note: "Pickup point"
  },
  {
    id: "taxi-destination",
    label: "Sukhumvit 11",
    type: "recommended",
    x: 78,
    y: 28,
    coordinates: { lat: 13.7422, lng: 100.5577 },
    note: "Destination"
  }
];

export function TaxiCheckForm() {
  const [pickup, setPickup] = useState("Suvarnabhumi Airport");
  const [destination, setDestination] = useState("Sukhumvit 11");
  const [selectedRouteId, setSelectedRouteId] = useState(taxiRoutes[0].id);
  const [hasEstimated, setHasEstimated] = useState(true);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [routeEstimate, setRouteEstimate] = useState<Partial<typeof taxiRoutes[number]> | null>(null);
  const [routeMapPins, setRouteMapPins] = useState<RouteMapPin[]>(initialTaxiMapPins);

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
      const response = await fetch("/api/routes/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: pickup, destination })
      });
      const data = await response.json();
      const distanceKm = Number(data?.route?.distanceMeters ?? 0) / 1000;
      const baseMinutes = Math.round(Number(data?.route?.durationSeconds ?? 0) / 60);
      const trafficMinutes = Math.round(Number(data?.route?.trafficDurationSeconds ?? 0) / 60);
      const fare = data?.fare;
      const geometry = Array.isArray(data?.route?.geometry) ? data.route.geometry.filter(isCoordinate) : [];

      if (distanceKm > 0 && fare) {
        const origin = geometry[0];
        const destinationPoint = geometry[geometry.length - 1];
        setRouteEstimate({
          badge: data?.source === "osrm-openstreetmap" ? "OSM street route" : "Local distance model",
          distance: `${distanceKm.toFixed(1)} km`,
          duration: `${baseMinutes}-${Math.max(baseMinutes, trafficMinutes)} min`,
          meterPrice: Number(fare.meterPrice ?? taxiRoutes[0].meterPrice),
          fees: Number(fare.fees ?? taxiRoutes[0].fees),
          total: Number(fare.total ?? taxiRoutes[0].total),
          comfort: data?.source === "osrm-openstreetmap"
            ? "Estimated from OpenStreetMap road geometry with SafeFlow fare math."
            : "Estimated from local Bangkok coordinates with SafeFlow fare math.",
          routeNote: `${pickup} -> ${destination}`
        });
        if (origin && destinationPoint) {
          setRouteMapPins(createTaxiPins(pickup, destination, origin, destinationPoint));
        }
        setSelectedRouteId("direct-meter");
      }
    } catch {
      setRouteEstimate(null);
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
          <p>Enter your pickup and destination to get a Bangkok fare estimate with safer route options.</p>
        </div>

        <div className="location-input-stack">
          <label className="field">
            <span><LocateFixed size={16} /> Your location</span>
            <input value={pickup} onChange={(event) => setPickup(event.target.value)} placeholder="Where are you now?" />
          </label>

          <label className="field">
            <span><MapPin size={16} /> Destination</span>
            <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Where do you want to go?" />
          </label>
        </div>

        <button type="button" className="primary-pill form-submit" onClick={handleEstimate} disabled={loadingEstimate}>
          <Navigation size={18} /> {loadingEstimate ? "Estimating..." : "Estimate price"}
        </button>

        <div className="route-option-list" aria-label="Hard-coded reroute recommendations">
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
              <span>{route.badge}</span>
              <strong>{route.label}</strong>
              <small>{route.routeNote}</small>
            </button>
          ))}
        </div>
      </motion.section>

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
            <span className="panel-label">Price estimation output</span>
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
            <span>Mock meter fare</span>
            <strong>{selectedRoute.meterPrice} THB</strong>
          </div>
          <div>
            <span>Tolls / airport / transit fees</span>
            <strong>{selectedRoute.fees} THB</strong>
          </div>
        </div>

        <button type="button" className="reroute-recommendation" onClick={() => setSelectedRouteId("airport-rail")}>
          <ShieldCheck size={21} />
          <span>
            <strong>Reroute recommendation</strong>
            <small>{selectedRoute.id === "airport-rail" ? selectedRoute.comfort : "Try Airport Rail Link + short taxi to lower the estimated taxi cost."}</small>
          </span>
        </button>
      </section>
    </div>
  );
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
      note: "Pickup point"
    },
    {
      id: "taxi-destination",
      label: destination || "Destination",
      type: "recommended",
      x: 78,
      y: 28,
      coordinates: destinationPoint,
      note: "Destination"
    }
  ];
}

function isCoordinate(value: unknown): value is Coordinates {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && typeof (value as Coordinates).lat === "number"
    && typeof (value as Coordinates).lng === "number";
}
