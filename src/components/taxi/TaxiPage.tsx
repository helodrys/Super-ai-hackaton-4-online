import { motion } from "framer-motion";
import { pageTransition } from "../../lib/motion";
import type { PageKey } from "../../types";
import { TaxiCheckForm } from "./TaxiCheckForm";

type TaxiPageProps = {
  onNavigate: (page: PageKey) => void;
};

export function TaxiPage({ onNavigate: _onNavigate }: TaxiPageProps) {
  return (
    <motion.div className="page-grid taxi-page" {...pageTransition}>
      <TaxiCheckForm />
    </motion.div>
  );
}
