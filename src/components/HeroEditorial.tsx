import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Compass } from "lucide-react";
import { AerodynamicOverlay } from "./AerodynamicOverlay";
import { DURATION, EASE_OUT } from "../lib/motionTokens";

interface HeroEditorialProps {
  onExplore: () => void;
  onDiscover: () => void;
}

export function HeroEditorial({ onExplore, onDiscover }: HeroEditorialProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-[640px] flex-col justify-end overflow-hidden bg-ink lg:min-h-[760px]">
      <img
        src="/images/hero/skydiver-demo.webp"
        alt="Paracaidista en caída libre sobre un manto de nubes, brazos extendidos — imagen de demostración para esta etapa del proyecto."
        className="absolute inset-0 h-full w-full object-cover object-[68%_38%]"
      />
      <AerodynamicOverlay />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/15 to-transparent" />

      <div className="absolute top-6 left-6 flex items-center gap-2 text-paper/70">
        <Compass size={14} aria-hidden="true" />
        <span className="font-display text-[10px] tracking-[0.18em] uppercase">04.36N · 74.05W</span>
      </div>
      <span className="font-display pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 -rotate-90 text-[10px] tracking-[0.3em] text-paper/40 uppercase">
        Forty Five · Colombia
      </span>

      <div className="relative px-6 pb-10 sm:px-10 sm:pb-14 lg:max-w-xl lg:pb-16">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.sectionIn, ease: EASE_OUT }}
          className="mb-4"
        >
          <span className="font-display text-xs tracking-[0.2em] text-accent uppercase">
            Forty Five // Indumentaria técnica
          </span>
        </motion.div>

        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.sectionIn, delay: 0.08, ease: EASE_OUT }}
          className="text-[clamp(2.6rem,6vw,4.5rem)] leading-[0.94] text-paper"
        >
          Desafía
          <br />
          la gravedad
        </motion.h1>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.sectionIn, delay: 0.18, ease: EASE_OUT }}
          className="mt-4 max-w-sm text-sm text-paper-dim normal-case sm:text-base"
        >
          Trajes diseñados para el aire y para tu estilo de vida.
        </motion.p>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.sectionIn, delay: 0.28, ease: EASE_OUT }}
          className="mt-7 flex flex-wrap items-center gap-5"
        >
          <motion.button
            type="button"
            onClick={onExplore}
            whileHover={reduceMotion ? undefined : { y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-display text-xs font-bold tracking-[0.1em] text-accent-ink uppercase transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none"
          >
            Explorar colección
            <ArrowRight size={14} />
          </motion.button>
          <button
            type="button"
            onClick={onDiscover}
            className="font-display text-xs font-semibold tracking-[0.1em] text-paper uppercase underline decoration-paper/30 underline-offset-4 transition hover:decoration-paper"
          >
            Conocer la marca
          </button>
        </motion.div>
      </div>
    </div>
  );
}
