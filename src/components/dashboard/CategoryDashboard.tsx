import { motion, useReducedMotion } from "motion/react";
import { CatalogMenu } from "./CatalogMenu";
import { TechnicalGallery } from "./TechnicalGallery";

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

export function CategoryDashboard() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-px bg-line">
      <motion.div
        variants={reduceMotion ? undefined : gridVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="show"
      >
        <CatalogMenu />
      </motion.div>

      <TechnicalGallery />
    </div>
  );
}
