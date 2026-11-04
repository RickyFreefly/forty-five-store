import { useEffect } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DURATION } from "../../lib/motionTokens";
import { useProductFocusStore } from "../../store/productFocus";

interface CategoryFlyoutProps {
  id: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Hosts an accordion category's content (gender selector + subcategory tabs +
 * product grid). From `lg` up it floats as an absolutely-positioned overlay
 * with a backdrop so it never pushes the hero/dashboard grid row around.
 * Below `lg` it renders inline, in normal flow, like a regular accordion.
 */
export function CategoryFlyout({ id, open, onClose, children }: CategoryFlyoutProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // A product focus view opened from inside this flyout owns Escape: it
      // closes first, and the flyout stays open underneath it.
      if (useProductFocusStore.getState().product !== null) return;
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <div
            key="category-flyout-backdrop"
            data-testid="category-flyout-backdrop"
            className="hidden lg:block fixed inset-0 z-20"
            onClick={onClose}
          />
          <motion.div
            key="category-flyout-content"
            id={id}
            className="lg:absolute lg:left-0 lg:right-0 lg:top-full lg:z-30"
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: DURATION.accordion }}
          >
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
