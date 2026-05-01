import { Check } from "lucide-react";
import { motion } from "framer-motion";

type SelectableOptionCardProps = {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
};

export function SelectableOptionCard({ label, description, selected, onClick }: SelectableOptionCardProps) {
  return (
    <motion.button
      type="button"
      className={`option-card ${selected ? "option-card-selected" : ""}`}
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <span>{label}</span>
      {description && <small>{description}</small>}
      {selected && <em><Check size={15} /></em>}
    </motion.button>
  );
}
