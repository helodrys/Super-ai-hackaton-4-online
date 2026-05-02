import { CloudRain, Leaf, ThermometerSun } from "lucide-react";
import { DEFAULT_TRIP_CONDITIONS } from "../../lib/tripConditions";

type TripConditionsMiniProps = {
  aqi?: number;
  aqiLabel?: string;
  temperature?: number;
  condition?: string;
  rainChance?: number;
};

export function TripConditionsMini({
  aqi = DEFAULT_TRIP_CONDITIONS.aqi,
  aqiLabel = DEFAULT_TRIP_CONDITIONS.aqiLabel,
  temperature = DEFAULT_TRIP_CONDITIONS.temperature,
  condition = DEFAULT_TRIP_CONDITIONS.condition,
  rainChance = DEFAULT_TRIP_CONDITIONS.rainChance
}: TripConditionsMiniProps) {
  return (
    <div className="trip-conditions-mini" aria-label={`Trip conditions: AQI ${aqi}, ${temperature} degrees, ${rainChance}% rain chance`}>
      <article className="condition-card condition-card-aqi">
        <Leaf size={15} />
        <span className="condition-label">AQI</span>
        <strong className="aqi-pill">{aqi} <small>{aqiLabel}</small></strong>
      </article>

      <article className="condition-card condition-card-temperature">
        <ThermometerSun size={15} />
        <span className="condition-label">Temp</span>
        <strong className="condition-value">{temperature}°C</strong>
        <small>{condition}</small>
      </article>

      <article className="condition-card condition-card-rain">
        <CloudRain size={15} />
        <span className="condition-label">Rain</span>
        <strong className="condition-value">{rainChance}%</strong>
        <small>โอกาสฝนตก</small>
      </article>
    </div>
  );
}
