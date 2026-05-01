import { motion } from "framer-motion";
import { pageTransition } from "../../lib/motion";
import type { PageKey, TripPlan } from "../../types";
import { PlannerStepper } from "./PlannerStepper";

type PlannerPageProps = {
  onNavigate: (page: PageKey) => void;
  onTripPlanGenerated: (plan: TripPlan) => void;
};

export function PlannerPage({ onNavigate, onTripPlanGenerated }: PlannerPageProps) {
  return (
    <motion.div className="planner-page" {...pageTransition}>
      <PlannerStepper onNavigate={onNavigate} onTripPlanGenerated={onTripPlanGenerated} />
    </motion.div>
  );
}
