import { motion } from "framer-motion";
import { CarTaxiFront, CloudRain, Gauge, Map, MapPin, Route, Sparkles, ThermometerSun, Wind } from "lucide-react";
import { cityConditions } from "../../data/weather";
import { pageTransition, staggerContainer } from "../../lib/motion";
import { createMapPinsFromTripPlan } from "../../lib/plannerEngine";
import { SafeFlowMapPanel } from "../SafeFlowMapPanel";
import { ConditionMetricCard } from "./ConditionMetricCard";
import { FeatureActionTile } from "./FeatureActionTile";
import { WeatherHeroCard } from "./WeatherHeroCard";
import type { PageKey, TripPlan } from "../../types";

type DashboardPageProps = {
  onNavigate: (page: PageKey) => void;
  latestTripPlan: TripPlan | null;
};

export function DashboardPage({ onNavigate, latestTripPlan }: DashboardPageProps) {
  const city = cityConditions[0];
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
          <ConditionMetricCard label="Feels Like" value={`${city.feelsLike} C`} status="Hot afternoon" trend="Indoor first" icon={ThermometerSun} />
          <ConditionMetricCard label="PM2.5" value={city.airQuality} status={`${city.pm25} AQ signal`} trend="Moderate" icon={Wind} />
          <ConditionMetricCard label="Travel Comfort" value={`${city.comfortScore}/100`} status="Smooth with timing" trend="+8 if indoors" icon={Gauge} />
          <ConditionMetricCard label="Rain Risk" value={city.rainRisk} status="Low disruption" trend="Carry shade" icon={CloudRain} />
        </motion.div>
      </div>

      <aside className="dashboard-side">
        <div className="section-heading">
          <span><Map size={15} /> Mini travel map</span>
          <h2>{latestTripPlan ? "This route feels smoother right now." : "Create a trip plan to unlock your route map."}</h2>
        </div>
        {latestTripPlan ? (
          <SafeFlowMapPanel pins={pins} selectedPin={pins[2]?.id ?? pins[0]?.id} />
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
                <article className="travel-plan-stop" key={place.placeId}>
                  <div className="travel-plan-index">{index + 1}</div>
                  <div>
                    <span>{place.time}</span>
                    <h3>{place.name}</h3>
                    <p>{place.reason}</p>
                    <div className="travel-plan-meta">
                      <em><MapPin size={13} /> {place.type}</em>
                      <em>{place.score}/100 fit</em>
                      <em>{place.estimatedCost} THB</em>
                    </div>
                  </div>
                </article>
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
