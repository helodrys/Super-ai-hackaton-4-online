import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { revealItem } from "../../lib/motion";

type ConditionMetricCardProps = {
  label: string;
  value: string;
  status: string;
  trend: string;
  icon: LucideIcon;
};

export function ConditionMetricCard({ label, value, status, trend, icon: Icon }: ConditionMetricCardProps) {
  return (
    <motion.article className="metric-card" variants={revealItem}>
      <div className="metric-icon"><Icon size={20} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{status}</p>
      <small>{trend}</small>
    </motion.article>
  );
}
