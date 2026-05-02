import { motion } from "framer-motion";
import { CarTaxiFront, CloudRain, Map, MapPin, Route, Sparkles, ThermometerSun, Wind } from "lucide-react";
import { pageTransition, staggerContainer } from "../../lib/motion";
import { createMapPinsFromTripPlan } from "../../lib/plannerEngine";
import { useLocalTripConditions, useTripConditions } from "../../lib/tripConditions";
import type { PageKey, RouteStop, TripPlan } from "../../types";
import { ThaiTAIMapPanel } from "../ThaiTAIMapPanel";
import { TripConditionsMini } from "../trip/TripConditionsMini";
import { ConditionMetricCard } from "./ConditionMetricCard";
import { FeatureActionTile } from "./FeatureActionTile";
import { WeatherHeroCard } from "./WeatherHeroCard";

type DashboardPageProps = {
  onNavigate: (page: PageKey) => void;
  latestTripPlan: TripPlan | null;
};

export function DashboardPage({ onNavigate, latestTripPlan }: DashboardPageProps) {
  const dashboardConditions = useLocalTripConditions();
  const pins = latestTripPlan ? createMapPinsFromTripPlan(latestTripPlan) : [];

  return (
    <motion.div className="page-grid dashboard-grid" {...pageTransition}>
      <div className="dashboard-main">
        <WeatherHeroCard />

        <section className="dashboard-quick-access" aria-label="Dashboard quick access">
          <button className="quick-access-card quick-access-taxi" onClick={() => onNavigate("taxi")}>
            <CarTaxiFront size={23} />
            <span>
              <strong>Check taxi price</strong>
              <small>Fast fare risk check</small>
            </span>
          </button>
          <button className="quick-access-card" onClick={() => onNavigate("planner")}>
            <Sparkles size={23} />
            <span>
              <strong>Plan a trip</strong>
              <small>Build around mood</small>
            </span>
          </button>
          <button className="quick-access-card" onClick={() => onNavigate(latestTripPlan ? "itinerary" : "planner")}>
            <Route size={23} />
            <span>
              <strong>{latestTripPlan ? "Open my route" : "Create my route"}</strong>
              <small>{latestTripPlan ? "See Bangkok map" : "No active plan yet"}</small>
            </span>
          </button>
        </section>

        <motion.div className="metric-grid" variants={staggerContainer} initial="hidden" animate="show">
          <ConditionMetricCard label="Temperature" value={`${dashboardConditions.temperature}°C`} status={`${dashboardConditions.conditionEmoji} ${dashboardConditions.condition}`} trend={`Feels like ${dashboardConditions.feelsLike}°C`} icon={ThermometerSun} />
          <ConditionMetricCard label="PM2.5" value={`${dashboardConditions.pm25}`} status={`${dashboardConditions.airQuality} · AQI ${dashboardConditions.aqi}`} trend={dashboardConditions.aqiLabel} icon={Wind} />
          <ConditionMetricCard label="Weather" value={dashboardConditions.condition} status={`${dashboardConditions.conditionEmoji} Live condition`} trend={dashboardConditions.locationLabel} emoji={dashboardConditions.conditionEmoji} />
          <ConditionMetricCard label="Wind / Rain" value={`${dashboardConditions.windSpeed} km/h`} status={`${dashboardConditions.rainChance}% rain chance`} trend="Live weather signal" icon={CloudRain} />
        </motion.div>
      </div>

      <aside className="dashboard-side">
        <div className="section-heading">
          <span><Map size={15} /> Mini travel map</span>
          <h2>{latestTripPlan ? "This route feels smoother right now." : "Create a trip plan to unlock your route map."}</h2>
        </div>
        {latestTripPlan ? (
          <ThaiTAIMapPanel pins={pins} selectedPin={pins[2]?.id ?? pins[0]?.id} />
        ) : (
          <section className="empty-route-map">
            <Sparkles size={28} />
            <strong>No active route in this session</strong>
            <p>Build a trip first, then your generated route will appear here until you refresh or start a new session.</p>
            <button className="primary-pill" onClick={() => onNavigate("planner")}>Plan a trip</button>
          </section>
        )}
        <section className="travel-plan-panel">
          <div className="travel-plan-heading">
            <span className="panel-label">Travel plan</span>
            <button className="text-link-button" onClick={() => onNavigate(latestTripPlan ? "itinerary" : "planner")}>
              {latestTripPlan ? "Open route" : "Create route"}
            </button>
          </div>
          {latestTripPlan ? (
            <div className="travel-plan-list" aria-label="Scrollable travel plan places">
              {latestTripPlan.stops.map((place, index) => (
                <TravelPlanStopCard key={place.placeId} place={place} index={index} />
              ))}
            </div>
          ) : (
            <div className="travel-plan-empty">
              <strong>Your travel plan is empty.</strong>
              <p>Use Plan a trip to create one route for this session.</p>
            </div>
          )}
        </section>
      </aside>
    </motion.div>
  );
}

function TravelPlanStopCard({ place, index }: { place: RouteStop; index: number }) {
  const conditions = useTripConditions(place.coordinates);

  return (
    <article className="travel-plan-stop">
      <div className="travel-plan-index">{index + 1}</div>
      <div className="travel-plan-stop-body">
        <span>{place.time}</span>
        <h3>{place.name}</h3>
        <p>{place.reason}</p>
        <div className="travel-plan-meta">
          <em><MapPin size={13} /> {place.type}</em>
        </div>
        <TripConditionsMini {...conditions} />
      </div>
    </article>
  );
}
