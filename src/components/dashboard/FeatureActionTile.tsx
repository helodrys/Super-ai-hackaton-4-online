import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { revealItem } from "../../lib/motion";
import type { PageKey } from "../../types";

type FeatureActionTileProps = {
  title: string;
  copy: string;
  icon: LucideIcon;
  page: PageKey;
  onNavigate: (page: PageKey) => void;
  accent: "teal" | "coral" | "purple" | "gold";
};

export function FeatureActionTile({ title, copy, icon: Icon, page, onNavigate, accent }: FeatureActionTileProps) {
  return (
    <motion.button className={`feature-tile tile-${accent}`} variants={revealItem} onClick={() => onNavigate(page)}>
      <span className="feature-icon"><Icon size={25} /></span>
      <strong>{title}</strong>
      <p>{copy}</p>
      <em>Open <ArrowRight size={15} /></em>
    </motion.button>
  );
}
