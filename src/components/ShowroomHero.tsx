import { motion, useReducedMotion } from "motion/react";
import { HeroEditorial } from "./HeroEditorial";
import { CategoryDashboard } from "./dashboard/CategoryDashboard";
import { DURATION, EASE_OUT } from "../lib/motionTokens";

interface ShowroomHeroProps {
  onExplore: () => void;
  onDiscover: () => void;
}

/** The first screen: editorial hero (left) + technical catalog dashboard (right), per the approved reference. */
export function ShowroomHero({ onExplore, onDiscover }: ShowroomHeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section id="inicio" className="grid lg:grid-cols-[56%_44%]">
      <HeroEditorial onExplore={onExplore} onDiscover={onDiscover} />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.sectionIn, delay: 0.2, ease: EASE_OUT }}
        className="bg-ink p-px"
      >
        <CategoryDashboard />
      </motion.div>
    </section>
  );
}
