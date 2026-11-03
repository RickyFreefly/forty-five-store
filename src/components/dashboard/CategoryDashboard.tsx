import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { TechnicalSuitsPanel } from "./TechnicalSuitsPanel";
import { CategoryProductCard } from "./CategoryProductCard";
import { StreetwearPanel } from "./StreetwearPanel";
import { AccessoriesPanel } from "./AccessoriesPanel";
import { TechnicalGallery } from "./TechnicalGallery";
import { DemoProductDialog, type DemoDialogContent } from "./DemoProductDialog";

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function CategoryDashboard() {
  const [demo, setDemo] = useState<DemoDialogContent | null>(null);
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-px bg-line">
      <motion.div
        className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4"
        variants={reduceMotion ? undefined : gridVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="show"
      >
        <motion.div variants={reduceMotion ? undefined : itemVariants}>
          <TechnicalSuitsPanel onOpenDemo={setDemo} />
        </motion.div>

        <motion.div variants={reduceMotion ? undefined : itemVariants}>
          <CategoryProductCard
            title="Prendas Sup."
            index="02"
            image="/images/products/jersey-demo-texture.png"
            alt="Detalle de textura de una chaqueta técnica Forty Five: panel de malla, costuras y cierre."
            caption="M / F · 6 slots"
            onClick={() =>
              setDemo({
                eyebrow: "Prendas superiores",
                title: "Chaquetas y jerseys técnicos",
                description:
                  "Capas superiores con paneles de flujo de aire, costuras planas y refuerzos donde el arnés hace fricción.",
                meta: "6 slots de exhibición",
              })
            }
          />
        </motion.div>

        <motion.div variants={reduceMotion ? undefined : itemVariants}>
          <CategoryProductCard
            title="Prendas Inf."
            index="03"
            image="/images/products/pantalon-demo.webp"
            alt="Pantalón técnico Forty Five con paneles de contraste, vista de estudio."
            caption="M / F · 6 slots"
            onClick={() =>
              setDemo({
                eyebrow: "Prendas inferiores",
                title: "Pantalones y joggers técnicos",
                description:
                  "Piezas inferiores con refuerzos y bolsillos de carga, pensadas para el área de empaque y el hangar.",
                meta: "6 slots de exhibición",
              })
            }
          />
        </motion.div>

        <motion.div variants={reduceMotion ? undefined : itemVariants} className="flex flex-col gap-px bg-line">
          <StreetwearPanel onOpenDemo={setDemo} />
          <AccessoriesPanel onOpenDemo={setDemo} />
        </motion.div>
      </motion.div>

      <TechnicalGallery />

      <AnimatePresence>{demo ? <DemoProductDialog content={demo} onClose={() => setDemo(null)} /> : null}</AnimatePresence>
    </div>
  );
}
