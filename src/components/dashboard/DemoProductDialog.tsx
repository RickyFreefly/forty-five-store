import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { DURATION } from "../../lib/motionTokens";

export interface DemoDialogContent {
  eyebrow: string;
  title: string;
  description: string;
  meta?: string;
}

interface DemoProductDialogProps {
  content: DemoDialogContent;
  onClose: () => void;
}

/** Lightweight overlay for dashboard panels that don't open the full ProductFocusView. */
export function DemoProductDialog({ content, onClose }: DemoProductDialogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATION.panel }}
    >
      <motion.div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden="true"
      />
      <motion.div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={content.title}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: DURATION.panel }}
        className="relative w-full max-w-sm border border-line bg-surface p-6 outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="font-display text-[11px] tracking-[0.15em] text-orange uppercase">{content.eyebrow}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1.5 text-paper-dim transition hover:bg-white/5 hover:text-paper focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <X size={16} />
          </button>
        </div>
        <h3 className="mt-2 text-xl text-paper">{content.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-paper-dim normal-case">{content.description}</p>
        {content.meta ? (
          <p className="font-display mt-4 text-[10px] tracking-[0.12em] text-paper-dim uppercase">{content.meta}</p>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
