import { motion } from "framer-motion";
import { CloudSun, Navigation, ShieldCheck, Wind } from "lucide-react";
import { cityConditions } from "../../data/weather";

const bangkok = cityConditions[0];

export function WeatherHeroCard() {
  return (
    <motion.section className="weather-hero-card" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
      <div>
        <span className="eyebrow"><Navigation size={15} /> Live city read</span>
        <h1>Ready for a smoother day in Bangkok?</h1>
        <p>We scan weather, PM2.5, travel friction, and local options so your day feels effortless.</p>
        <div className="hero-actions">
          <span><ShieldCheck size={17} /> Comfort score {bangkok.comfortScore}/100</span>
          <span><Wind size={17} /> PM2.5 {bangkok.pm25} - {bangkok.airQuality}</span>
        </div>
      </div>

      <div className="weather-orbit" aria-label={`${bangkok.weather}, ${bangkok.temperature} C`}>
        <motion.div
          className="weather-sun"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <CloudSun size={58} />
        <strong>{bangkok.temperature} C</strong>
        <span>Feels like {bangkok.feelsLike} C</span>
      </div>
    </motion.section>
  );
}
