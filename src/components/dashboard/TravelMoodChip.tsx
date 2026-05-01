import { motion } from "framer-motion";

type TravelMoodChipProps = {
  label: string;
  selected?: boolean;
};

export function TravelMoodChip({ label, selected = false }: TravelMoodChipProps) {
  return (
    <motion.button
      className={`mood-chip ${selected ? "mood-chip-selected" : ""}`}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -3 }}
    >
      {label}
    </motion.button>
  );
}
