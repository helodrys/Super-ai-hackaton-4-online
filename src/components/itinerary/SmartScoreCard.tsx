import { motion } from "framer-motion";
import type { TripPlan } from "../../types";

type SmartScoreCardProps = {
  plan: TripPlan;
};

export function SmartScoreCard({ plan }: SmartScoreCardProps) {
  const scoreRows = [
    ["Crowd Comfort", plan.scores.crowdComfort],
    ["Food Match", plan.scores.foodMatch],
    ["Local Authenticity", plan.scores.localAuthenticity],
    ["Accessibility Fit", plan.scores.accessibilityFit],
    ["Weather Suitability", plan.scores.weatherSuitability],
    ["Budget Fit", plan.scores.budgetFit]
  ] as const;

  return (
    <section className="score-panel">
      <span className="panel-label">Smart score</span>
      <h2>Route fit signals</h2>
      <div className="score-list">
        {scoreRows.map(([label, value], index) => (
          <div className="score-row" key={label}>
            <div><span>{label}</span><strong>{value}/100</strong></div>
            <div className="score-track">
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ delay: 0.2 + index * 0.08, duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
