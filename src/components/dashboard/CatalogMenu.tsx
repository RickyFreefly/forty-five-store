import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { CATALOG_CATEGORIES, type CategoryId } from "../../data/catalogTaxonomy";
import { CategoryAccordion } from "./CategoryAccordion";
import { AccessoriesPanel } from "./AccessoriesPanel";
import { DemoProductDialog, type DemoDialogContent } from "./DemoProductDialog";

/**
 * All four CATALOG_CATEGORIES rendered side by side as CategoryAccordions, plus
 * AccessoriesPanel stacked with Streetwear in the same grid cell (Accessories is
 * not part of the accordion/flyout system). Owns the "only one open at a time"
 * state and the lightweight demo dialog that Accessories (and, via
 * CategoryAccordion, nothing else) uses.
 */
export function CatalogMenu() {
  const [openCategory, setOpenCategory] = useState<CategoryId | null>(null);
  const [demo, setDemo] = useState<DemoDialogContent | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line">
      {CATALOG_CATEGORIES.map((category) => {
        const accordion = (
          <CategoryAccordion
            key={category.id}
            category={category}
            isOpen={openCategory === category.id}
            onToggle={() => setOpenCategory((cur) => (cur === category.id ? null : category.id))}
          />
        );

        if (category.id === "streetwear") {
          return (
            <div key={category.id} className="flex flex-col gap-px bg-line">
              {accordion}
              <AccessoriesPanel onOpenDemo={setDemo} />
            </div>
          );
        }

        return accordion;
      })}

      <AnimatePresence>{demo ? <DemoProductDialog content={demo} onClose={() => setDemo(null)} /> : null}</AnimatePresence>
    </div>
  );
}
