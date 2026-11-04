import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { CategoryConfig, Gender } from "../../data/catalogTaxonomy";
import { resolveCatalogSlice } from "../../data/catalogTaxonomy";
import { DashboardPanel } from "./DashboardPanel";
import { GenderSelector } from "./GenderSelector";
import { SubcategorySelector } from "./SubcategorySelector";
import { ProductGrid } from "./ProductGrid";
import { CategoryFlyout } from "./CategoryFlyout";
import { DURATION } from "../../lib/motionTokens";

interface CategoryAccordionProps {
  category: CategoryConfig;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * One row of the catalog dashboard: a trigger (category name + index + chevron)
 * that opens a CategoryFlyout holding gender/subcategory selection and the
 * resulting product grid. Fully controlled from outside via isOpen/onToggle —
 * this component only owns its own gender/subcategory selections.
 */
export function CategoryAccordion({ category, isOpen, onToggle }: CategoryAccordionProps) {
  const [gender, setGender] = useState<Gender>("M");
  const [subcategoryId, setSubcategoryId] = useState(category.subcategories?.[0]?.id ?? "");

  const triggerWrapperRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      triggerWrapperRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const flyoutId = `category-flyout-${category.id}`;
  const slots = category.subcategories?.find((s) => s.id === subcategoryId)?.slots ?? category.slots!;
  const products = resolveCatalogSlice(category.id, gender, subcategoryId);

  return (
    <div className="lg:relative">
      <div ref={triggerWrapperRef}>
        <DashboardPanel
          as="button"
          title={category.label}
          index={category.index}
          onClick={onToggle}
          ariaExpanded={isOpen}
          ariaControls={flyoutId}
        >
          <div className="flex items-center justify-center px-4 py-2 text-paper-dim">
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
              className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            >
              <path d="M3 5l5 6 5-6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </DashboardPanel>
      </div>

      <CategoryFlyout id={flyoutId} open={isOpen} onClose={onToggle}>
        <div className="flex flex-col gap-3 border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center gap-3">
            <GenderSelector value={gender} onChange={setGender} />
            {category.subcategories ? (
              <SubcategorySelector options={category.subcategories} value={subcategoryId} onChange={setSubcategoryId} />
            ) : null}
          </div>

          <motion.div
            key={gender + subcategoryId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DURATION.genderSwitch }}
          >
            <ProductGrid products={products} slots={slots} />
          </motion.div>
        </div>
      </CategoryFlyout>
    </div>
  );
}
