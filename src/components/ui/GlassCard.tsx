import { motion } from "framer-motion";
import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  accent?: "teal" | "coral" | "purple" | "gold";
};

export function GlassCard({ children, className = "", accent = "teal" }: GlassCardProps) {
  return (
    <motion.section
      className={`glass-card glow-${accent} ${className}`}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}
