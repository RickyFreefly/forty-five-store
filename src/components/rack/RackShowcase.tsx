import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { COLORS, PROD, RACK, hasBack, photoUrl, type RoperoPhotoSet, type RoperoProduct } from "../../data/ropero";
import { formatCOP } from "../../data/products";
import { useCartStore } from "../../store/cart";
import { EASE_OUT, SPRING_SETTLE } from "../../lib/motionTokens";

/**
 * El Ropero — riel de prendas colgadas. Al tocar una prenda, el resto se desenfoca y la
 * elegida viaja al centro (layoutId compartido) con nombre, precio, frente/espalda, colores
 * y tallas; las flechas pasan a la prenda vecina sin salir del enfoque.
 */

// Alto de cada prenda colgada, relativo al alto base del riel (los pantalones cuelgan más largo).
const HANG: Record<RoperoPhotoSet, number> = { hoodie: 0.9, tee: 0.92, polo: 0.92, pant: 1.45 };

const garmentId = (i: number) => `garment-${i}`;

export function RackShowcase() {
  const [focus, setFocus] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);

  const step = useCallback(
    (dir: 1 | -1) => setFocus((f) => (f === null ? f : (f + dir + RACK.length) % RACK.length)),
    [],
  );

  // Devuelve el foco del teclado a la prenda que se cerró.
  const close = useCallback(() => {
    setFocus((f) => {
      if (f !== null) requestAnimationFrame(() => railRef.current?.querySelectorAll("button")[f]?.focus());
      return null;
    });
  }, []);

  useEffect(() => {
    if (focus === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, close, step]);

  return (
    <section
      id="ropero"
      aria-label="El Ropero"
      className="relative h-[calc(100dvh-89px)] min-h-[560px] overflow-hidden bg-paper text-ink [--rack-h:clamp(150px,22vh,230px)] lg:[--rack-h:clamp(140px,19vh,220px)]"
    >
      <LayoutGroup>
        <motion.div
          animate={{ opacity: focus === null ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none absolute inset-x-0 top-[5%] text-center"
        >
          <p className="font-display text-[11px] tracking-[0.28em] text-ink/50 uppercase">El Ropero · Drop 01</p>
          <p className="mt-2 text-sm text-ink/60">
            <span className="lg:hidden">Desliza el riel y toca</span>
            <span className="hidden lg:inline">Toca</span> una prenda para verla de cerca
          </p>
        </motion.div>

        {/* Riel */}
        <div className="absolute inset-x-0 top-[22%]">
          <div className="mx-auto h-1.5 w-[94%] max-w-[1320px] rounded-full bg-gradient-to-b from-metal to-metal-dark shadow-[0_2px_6px_rgba(33,31,32,0.25)]" />
          <div
            ref={railRef}
            className="mx-auto -mt-1 flex max-w-[1320px] snap-x snap-mandatory items-start justify-center-safe gap-3 overflow-x-auto px-[6%] pb-8 [scrollbar-width:none] sm:gap-4 lg:px-[3%]"
          >
            {RACK.map((item, i) => {
              const product = PROD[item.productId];
              const dimmed = focus !== null && focus !== i;
              return (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => setFocus(i)}
                  aria-label={`${product.name}, ${COLORS[item.color][0]}`}
                  initial={reduceMotion ? false : { opacity: 0, y: -28 }}
                  animate={{
                    // La prenda enfocada deja su lugar vacío (gancho incluido) mientras está en el centro.
                    opacity: focus === i ? 0 : dimmed ? 0.35 : 1,
                    y: 0,
                    filter: dimmed ? "blur(6px)" : "blur(0px)",
                    scale: dimmed ? 0.94 : 1,
                  }}
                  transition={{ ...SPRING_SETTLE, delay: focus === null && !reduceMotion ? 0.05 * i : 0 }}
                  whileHover={reduceMotion || focus !== null ? undefined : { rotate: 2.5 }}
                  style={{ transformOrigin: "50% 0%" }}
                  className="group flex shrink-0 snap-center flex-col items-center rounded-lg focus-visible:ring-2 focus-visible:ring-orange focus-visible:outline-none"
                >
                  <Hanger className="h-7 w-16 sm:h-8 sm:w-20" />
                  {focus === i ? (
                    // Hueco del mismo tamaño mientras la prenda está en el centro.
                    <span style={{ height: `calc(var(--rack-h) * ${HANG[product.photo]})` }} className="block aspect-[0.6]" />
                  ) : (
                    <motion.img
                      layoutId={garmentId(i)}
                      src={photoUrl(product, item.color)}
                      alt=""
                      draggable={false}
                      style={{ height: `calc(var(--rack-h) * ${HANG[product.photo]})` }}
                      className="-mt-1 w-auto object-contain drop-shadow-[0_10px_14px_rgba(33,31,32,0.18)] select-none"
                      transition={{ duration: 0.55, ease: EASE_OUT }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {focus !== null ? (
            <FocusView key="focus" index={focus} onClose={close} onStep={step} />
          ) : null}
        </AnimatePresence>
      </LayoutGroup>
    </section>
  );
}

interface FocusViewProps {
  index: number;
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
}

function FocusView({ index, onClose, onStep }: FocusViewProps) {
  const item = RACK[index];
  const product = PROD[item.productId];
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rack-focus-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-20"
    >
      {/* Fondo: un clic fuera de la prenda cierra el enfoque. */}
      <button type="button" aria-hidden="true" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default bg-paper/30" />

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Volver al riel"
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-paper text-ink transition hover:bg-ink hover:text-paper focus-visible:ring-2 focus-visible:ring-orange focus-visible:outline-none"
      >
        <X size={18} />
      </button>

      <ArrowButton side="left" onClick={() => onStep(-1)} />
      <ArrowButton side="right" onClick={() => onStep(1)} />

      {/* key = índice: al cambiar de prenda se reinician color, lado y talla. */}
      <FocusContent key={index} index={index} product={product} initialColor={item.color} />
    </motion.div>
  );
}

function FocusContent({ index, product, initialColor }: { index: number; product: RoperoProduct; initialColor: string }) {
  const [color, setColor] = useState(initialColor);
  const [side, setSide] = useState<"front" | "back">("front");
  const [size, setSize] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const reduceMotion = useReducedMotion();
  const backOk = hasBack(product, color);
  const tall = product.photo === "pant";

  function add() {
    if (!size) return;
    addItem(
      { productId: product.id, name: product.name, priceCOP: product.price, size, colorId: color, colorName: COLORS[color][0] },
      1,
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-14 pt-4 pb-6 sm:gap-6">
      <div className="relative flex flex-col items-center">
        <Hanger className="h-9 w-24" />
        <motion.img
          layoutId={garmentId(index)}
          key={`${color}-${side}`}
          src={photoUrl(product, color, side)}
          alt={`${product.name} en ${COLORS[color][0]}, ${side === "front" ? "de frente" : "de espalda"}`}
          draggable={false}
          className={`-mt-1 w-auto object-contain drop-shadow-[0_18px_24px_rgba(33,31,32,0.22)] select-none ${
            tall ? "h-[min(46vh,420px)]" : "h-[min(36vh,340px)]"
          }`}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        />
        <HangTags price={formatCOP(product.price)} badge={product.badge} swing={!reduceMotion} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2, ease: EASE_OUT }}
        className="pointer-events-auto flex w-full max-w-md flex-col items-center gap-3 text-center"
      >
        <div>
          <h2 id="rack-focus-title" className="text-xl leading-tight sm:text-2xl">
            {product.name}
          </h2>
          <p className="tnum mt-1 text-sm text-ink/70">{formatCOP(product.price)}</p>
        </div>

        <div role="group" aria-label="Vista" className="flex rounded-full border border-ink/15 p-0.5 text-[11px] font-semibold tracking-[0.12em] uppercase">
          {(["front", "back"] as const).map((s) => {
            const disabled = s === "back" && !backOk;
            return (
              <button
                key={s}
                type="button"
                disabled={disabled}
                aria-pressed={side === s}
                title={disabled ? "Foto de espalda en camino" : undefined}
                onClick={() => setSide(s)}
                className={`rounded-full px-4 py-1.5 transition focus-visible:ring-2 focus-visible:ring-orange focus-visible:outline-none ${
                  side === s ? "bg-ink text-paper" : "text-ink/70 hover:text-ink"
                } disabled:cursor-not-allowed disabled:text-ink/30`}
              >
                {s === "front" ? "Frente" : "Espalda"}
              </button>
            );
          })}
        </div>

        <div role="radiogroup" aria-label="Color" className="flex max-w-full flex-wrap justify-center gap-1.5">
          {product.colors.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={COLORS[c][0]}
              title={COLORS[c][0]}
              onClick={() => {
                setColor(c);
                setSide("front");
              }}
              style={{ backgroundColor: COLORS[c][1] }}
              className={`h-6 w-6 rounded-full border border-ink/20 transition focus-visible:outline-none ${
                color === c ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "hover:scale-110 focus-visible:ring-2 focus-visible:ring-orange"
              }`}
            />
          ))}
        </div>

        <div role="radiogroup" aria-label="Talla" className="flex gap-1.5">
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={size === s}
              onClick={() => setSize(s)}
              className={`tnum h-9 min-w-9 rounded-full border px-2 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-orange focus-visible:outline-none ${
                size === s ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={add}
          disabled={!size}
          className="mt-1 w-full max-w-xs rounded-full bg-ink px-6 py-3 font-display text-xs font-bold tracking-[0.12em] text-paper uppercase transition hover:bg-orange focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-paper focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink/45"
        >
          {size ? `Agregar al carrito · ${formatCOP(product.price)}` : "Elige tu talla"}
        </button>
      </motion.div>
    </div>
  );
}

function ArrowButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Prenda anterior" : "Prenda siguiente"}
      className={`absolute top-[32%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink/15 bg-paper/90 text-ink transition hover:bg-ink hover:text-paper focus-visible:ring-2 focus-visible:ring-orange focus-visible:outline-none sm:top-1/3 ${
        side === "left" ? "left-2 sm:left-[8%]" : "right-2 sm:right-[8%]"
      }`}
    >
      <Icon size={20} />
    </button>
  );
}

/** Dos etiquetas colgando del gancho que se mecen, como las del reel. */
function HangTags({ price, badge, swing }: { price: string; badge: string; swing: boolean }) {
  const sway = (delay: number) =>
    swing
      ? { animate: { rotate: [-5, 5, -5] }, transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const, delay } }
      : {};
  return (
    <div aria-hidden="true" className="absolute top-8 left-[calc(100%-8px)] flex gap-1.5">
      <motion.div {...sway(0)} style={{ transformOrigin: "50% 0%" }} className="flex flex-col items-center">
        <span className="h-4 w-px bg-ink/40" />
        <span className="flex h-12 w-7 flex-col items-center justify-center rounded-sm bg-ink font-display text-[11px] font-bold text-paper">45</span>
      </motion.div>
      {/* En pantallas angostas no cabe junto a la prenda; el precio ya está debajo. */}
      <motion.div {...sway(0.4)} style={{ transformOrigin: "50% 0%" }} className="mt-2 hidden flex-col items-center sm:flex">
        <span className="h-3 w-px bg-ink/40" />
        <span className="flex w-14 flex-col items-center rounded-sm border border-ink/15 bg-white px-1 py-1.5 text-center">
          <span className="text-[7px] tracking-[0.14em] text-orange uppercase">{badge}</span>
          <span className="tnum mt-0.5 text-[9px] font-semibold text-ink">{price}</span>
        </span>
      </motion.div>
    </div>
  );
}

function Hanger({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 32" fill="none" aria-hidden="true" className={`relative z-10 text-metal-dark ${className}`}>
      <path d="M40 12c0-3 2.6-4.2 2.6-6.6A2.6 2.6 0 0 0 40 2.8a2.6 2.6 0 0 0-2.6 2.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 12 6 29h68L40 12Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}
