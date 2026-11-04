import { useRef, type ReactNode } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ScrollSequence } from "./ScrollSequence";
import { CoordinateTag } from "./brand/BrandMotifs";
import { EXIT_ALTITUDE_M, formatAltitude, progressToAltitude } from "../lib/scrollSequence";

/** Frames in public/sequences/caida — update when the real video is extracted (see its README). */
const FRAME_COUNT = 72;
const DEPLOY_ALTITUDE_M = 1500;

// White copy straight on the footage: a soft shadow instead of a heavy overlay.
const ON_FOOTAGE = "[text-shadow:0_1px_2px_rgba(33,31,32,0.6),0_2px_18px_rgba(33,31,32,0.55)]";

const FEATURES = [
  { title: "Costuras", body: "Planas y reforzadas en las zonas de tensión: nada roza, nada cede a 200 km/h." },
  { title: "Aerodinámica", body: "Paneles con corte de flujo que reducen el flameo y estabilizan la postura." },
  { title: "Materiales", body: "Tejido técnico ligero de 4 vías, transpirable y de secado rápido." },
];

interface FreefallSectionProps {
  onShop: () => void;
}

/** Jump → freefall → close pass over the suit → landing, scrubbed with the scroll. */
export function FreefallSection({ onShop }: FreefallSectionProps) {
  return (
    <ScrollSequence
      id="caida-libre"
      basePath="/sequences/caida"
      mobileBasePath="/sequences/caida/mobile"
      frameCount={FRAME_COUNT}
      heightVh={420}
      label="Paracaidista en caída libre vistiendo el traje FORTY FIVE, desde el salto hasta el aterrizaje."
    >
      {(progress) => (
        <>
          {/* Soft edge scrims so copy and altimeter stay legible on bright sky — not a full overlay.
              Both live on the left: the skydiver is framed on the right of every shot. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/15 to-transparent lg:via-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/55 to-transparent" />
          <Altimeter progress={progress} />

          {/* Es lo primero de la landing: visible desde el scroll 0, sin esperar a entrar. */}
          <Phase progress={progress} range={[-1, 0, 0.22, 0.3]} className="items-end pb-20 sm:pb-24">
            <CoordinateTag label="Salida · 4.000 m" />
            <h2 className={`mt-4 text-[clamp(2.2rem,5.5vw,4rem)] leading-[0.95] text-paper ${ON_FOOTAGE}`}>
              Hecho para
              <br />
              caer bien
            </h2>
            <p className={`mt-4 max-w-sm text-sm text-paper normal-case sm:text-base ${ON_FOOTAGE}`}>
              El traje técnico FORTY FIVE, de la puerta del avión al suelo. Baja con él.
            </p>
          </Phase>

          <Phase progress={progress} range={[0.34, 0.4, 0.62, 0.68]} className="items-center">
            <span className={`font-display text-xs tracking-[0.2em] text-accent uppercase ${ON_FOOTAGE}`}>
              De cerca · El traje
            </span>
            <ul className="mt-5 grid max-w-md gap-5">
              {FEATURES.map((f, i) => (
                <FeatureItem key={f.title} progress={progress} start={0.38 + i * 0.05} index={i} title={f.title}>
                  {f.body}
                </FeatureItem>
              ))}
            </ul>
          </Phase>

          <Phase progress={progress} range={[0.82, 0.9, 1.01, 1.02]} className="items-end pb-20 sm:pb-24">
            <CoordinateTag label="Aterrizaje · 0 m" />
            <h2 className={`mt-4 text-[clamp(2.2rem,5.5vw,4rem)] leading-[0.95] text-paper ${ON_FOOTAGE}`}>
              Toca tierra.
              <br />
              Sigue con él.
            </h2>
            <button
              type="button"
              onClick={onShop}
              className="pointer-events-auto mt-7 flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-display text-xs font-bold tracking-[0.1em] text-accent-ink uppercase transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none"
            >
              Ir a la tienda
              <ArrowRight size={14} />
            </button>
          </Phase>
        </>
      )}
    </ScrollSequence>
  );
}

interface PhaseProps {
  progress: MotionValue<number>;
  /** [fade-in start, fully visible, fade-out start, gone] in scroll progress. */
  range: [number, number, number, number];
  className?: string;
  children: ReactNode;
}

function Phase({ progress, range, className, children }: PhaseProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useTransform(progress, range, [0, 1, 1, 0]);
  const y = useTransform(progress, range, reduceMotion ? [0, 0, 0, 0] : [28, 0, 0, -28]);
  const visibility = useTransform(opacity, (o) => (o < 0.01 ? "hidden" : "visible"));

  return (
    <motion.div
      style={{ opacity, y, visibility }}
      className={`pointer-events-none absolute inset-0 flex pr-6 pl-24 sm:pr-10 sm:pl-40 lg:pr-16 lg:pl-48 ${className ?? ""}`}
    >
      <div className="max-w-xl">{children}</div>
    </motion.div>
  );
}

interface FeatureItemProps {
  progress: MotionValue<number>;
  start: number;
  index: number;
  title: string;
  children: ReactNode;
}

function FeatureItem({ progress, start, index, title, children }: FeatureItemProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useTransform(progress, [start, start + 0.04], [0, 1]);
  const x = useTransform(progress, [start, start + 0.04], reduceMotion ? [0, 0] : [-16, 0]);

  return (
    <motion.li style={{ opacity, x }} className="border-l border-accent/70 pl-4">
      <span className={`font-display text-[10px] tracking-[0.2em] text-paper/70 uppercase ${ON_FOOTAGE}`}>
        0{index + 1}
      </span>
      <h3 className={`text-xl text-paper sm:text-2xl ${ON_FOOTAGE}`}>{title}</h3>
      <p className={`mt-1 text-sm text-paper normal-case ${ON_FOOTAGE}`}>{children}</p>
    </motion.li>
  );
}

const ALTIMETER_TICKS = [4000, 3000, 2000, DEPLOY_ALTITUDE_M, 1000, 0];

function Altimeter({ progress }: { progress: MotionValue<number> }) {
  const readoutRef = useRef<HTMLSpanElement>(null);
  const markerTop = useTransform(progress, [0, 1], ["0%", "100%"]);

  // Write the number straight to the DOM — no React re-render per scroll frame.
  useMotionValueEvent(progress, "change", (p) => {
    if (readoutRef.current) readoutRef.current.textContent = formatAltitude(progressToAltitude(p));
  });

  return (
    <div
      className="pointer-events-none absolute top-1/2 left-3 flex h-[56svh] -translate-y-1/2 items-stretch gap-2 sm:left-8 sm:gap-3"
      role="group"
      aria-label="Altímetro"
    >
      <div className="relative w-6">
        <div className="absolute inset-y-0 left-0 w-px bg-paper/40" />
        {ALTIMETER_TICKS.map((alt) => (
          <div
            key={alt}
            className="absolute left-0 flex -translate-y-1/2 items-center gap-1"
            style={{ top: `${(1 - alt / EXIT_ALTITUDE_M) * 100}%` }}
          >
            <span className={`h-px ${alt === DEPLOY_ALTITUDE_M ? "w-4 bg-orange" : "w-2.5 bg-paper/60"}`} />
            {alt === DEPLOY_ALTITUDE_M ? (
              <span className="font-display hidden text-[8px] tracking-[0.15em] text-orange uppercase sm:inline">Apertura</span>
            ) : null}
          </div>
        ))}
        <motion.div
          style={{ top: markerTop }}
          className="absolute left-0 h-0.5 w-6 -translate-y-1/2 bg-accent shadow-[0_0_10px_rgba(218,255,4,0.6)]"
        />
      </div>

      <div className="flex flex-col items-start justify-between py-0.5">
        <span className="font-display text-[9px] tracking-[0.2em] text-paper/60 uppercase">Alt</span>
        <span className={`font-display tnum text-left text-paper ${ON_FOOTAGE}`}>
          <span ref={readoutRef} className="block text-lg leading-none font-bold sm:text-3xl">
            {formatAltitude(progressToAltitude(progress.get()))}
          </span>
          <span className="text-[9px] tracking-[0.2em] text-paper/70 uppercase sm:text-[10px]">metros</span>
        </span>
        <span className="font-display text-[9px] tracking-[0.2em] text-paper/60 uppercase">MSL</span>
      </div>
    </div>
  );
}
