import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CATALOG_CATEGORIES, type CategoryId } from "../../data/catalogTaxonomy";
import { CategoryAccordion } from "./CategoryAccordion";
import { AccessoriesPanel } from "./AccessoriesPanel";
import { DemoProductDialog, type DemoDialogContent } from "./DemoProductDialog";

/** Per-cell entrance; stagger timing comes from the parent motion.div in CategoryDashboard. */
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/**
 * All four CATALOG_CATEGORIES rendered side by side as CategoryAccordions, plus
 * AccessoriesPanel stacked with Streetwear in the same grid cell (Accessories is
 * not part of the accordion/flyout system). Owns the "only one open at a time"
 * state and the lightweight demo dialog that Accessories uses.
 *
 * Layout: the grid itself is the `lg` positioning context for every
 * CategoryFlyout, so an open flyout spans the full dashboard width and sits
 * directly under the whole menu block, whichever category opened it. Grid
 * cells keep the default `stretch` alignment and their content fills them
 * (triggers grow; at lg Accessories takes the rest of the Streetwear column),
 * so the `bg-line` gap colour never shows through as an empty block.
 */
export function CatalogMenu() {
  const [openCategory, setOpenCategory] = useState<CategoryId | null>(null);
  const [demo, setDemo] = useState<DemoDialogContent | null>(null);
  const reduceMotion = useReducedMotion();
  const variants = reduceMotion ? undefined : itemVariants;

  return (
    <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:relative lg:grid-cols-4">
      {CATALOG_CATEGORIES.map((category) => {
        const isStack = category.id === "streetwear";
        const accordion = (
          <CategoryAccordion
            category={category}
            isOpen={openCategory === category.id}
            onToggle={() => setOpenCategory((cur) => (cur === category.id ? null : category.id))}
            className={isStack ? undefined : "flex-1"}
          />
        );

        return (
          <motion.div
            key={category.id}
            variants={variants}
            className={`flex flex-col ${isStack ? "bg-surface" : ""}`}
          >
            {accordion}
            {/* Accessories only grows to fill the column at lg (where flyouts are
                absolute, so rows never grow). Below lg an inline flyout in the
                row-sibling would stretch it huge; the leftover cell area is
                bg-surface instead, matching the cards. */}
            {isStack ? (
              <div className="flex flex-col border-t border-line lg:flex-1">
                <AccessoriesPanel onOpenDemo={setDemo} />
              </div>
            ) : null}
          </motion.div>
        );
      })}

      <AnimatePresence>{demo ? <DemoProductDialog content={demo} onClose={() => setDemo(null)} /> : null}</AnimatePresence>
    </div>
  );
}
