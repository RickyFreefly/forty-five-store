import { motion, useReducedMotion } from "motion/react";
import { CoordinateTag, SealFortyFive } from "./brand/BrandMotifs";
import { DURATION, EASE_OUT } from "../lib/motionTokens";

const VALUES = ["Precisión", "Control", "Ergonomía", "Aerodinámica", "Ligereza", "Libertad", "Rendimiento", "Sofisticación"];

const SECONDARY_MESSAGES = ["Resistencia cero", "Indumentaria técnica", "Precisión en cada movimiento"];

export function BrandPhilosophy() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="filosofia" className="relative overflow-hidden border-t border-line py-24">
      <SealFortyFive className="pointer-events-none absolute -top-10 right-[-40px] h-64 w-64 text-paper opacity-[0.07]" />

      <div className="mx-auto max-w-6xl px-5">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: DURATION.sectionIn, ease: EASE_OUT }}
          className="max-w-xl"
        >
          <CoordinateTag label="Nuestra filosofía" />
          <h2 className="mt-4 text-3xl text-paper sm:text-4xl">El cielo es nuestro elemento natural.</h2>
          <p className="mt-4 text-sm leading-relaxed text-paper-dim normal-case">
            FORTY FIVE nace del cruce entre ingeniería técnica de alto rendimiento y la libertad del vuelo.
            Cada prenda se construye para moverse contigo entre el hangar, el túnel de viento y la caída libre.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {VALUES.map((value, i) => (
            <motion.div
              key={value}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: DURATION.sectionIn, delay: i * 0.04, ease: EASE_OUT }}
              className="border-t border-line pt-3"
            >
              <span className="font-display text-sm tracking-[0.08em] text-paper uppercase">{value}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-x-10 gap-y-3">
          {SECONDARY_MESSAGES.map((msg) => (
            <span key={msg} className="font-display text-xs tracking-[0.15em] text-accent uppercase">
              {msg}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
