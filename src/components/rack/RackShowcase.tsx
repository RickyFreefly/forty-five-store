import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { COLORS, PROD, RACK, hasView, photoUrl, type RoperoKind, type RoperoProduct, type RoperoView } from "../../data/ropero";
import { formatCOP } from "../../data/products";
import { useCartStore } from "../../store/cart";
import { EASE_OUT, SPRING_SETTLE } from "../../lib/motionTokens";

/**
 * El Ropero — riel de prendas colgadas. Al tocar una prenda, el resto se desenfoca y la
 * elegida viaja al centro (layoutId compartido) con nombre, precio, frente/espalda/lado, colores
 * y tallas; las flechas pasan a la prenda vecina sin salir del enfoque.
 */

// Alto de cada prenda colgada, relativo al alto base del riel (los pantalones cuelgan más largo).
const HANG: Record<RoperoKind, number> = { hoodie: 0.9, tee: 0.86, longsleeve: 0.98, pant: 1.45 };

const garmentId = (i: number) => `garment-${i}`;

// Ancho del gancho en la vista de cerca.
const FOCUS_HOOK = "min(4.2vh,38px)";

// Péndulo poco amortiguado: la prenda oscila un par de veces antes de quedar quieta.
const SWING = { type: "spring" as const, stiffness: 90, damping: 7, mass: 0.8 };

const VIEWS: { id: RoperoView; label: string; alt: string }[] = [
  { id: "front", label: "Frente", alt: "de frente" },
  { id: "back", label: "Espalda", alt: "de espalda" },
  { id: "side", label: "Lado", alt: "de lado" },
];

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
            Desliza el riel y toca una prenda para verla de cerca
          </p>
        </motion.div>

        {/* Riel */}
        <div className="absolute inset-x-0 top-[22%]">
          {/* El riel va por delante de los ganchos: así cada gancho parece rodearlo. */}
          {/* Con una prenda en el centro el riel se desvanece: de cerca solo quedan la prenda y su gancho. */}
          <motion.div
            animate={{ opacity: focus === null ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-20 mx-auto h-1.5 w-[94%] max-w-[1320px] rounded-full bg-gradient-to-b from-metal to-metal-dark shadow-[0_2px_6px_rgba(33,31,32,0.25)]"
          />
          <div
            ref={railRef}
            className="mx-auto -mt-[11px] flex max-w-[1320px] snap-x snap-mandatory items-start justify-center-safe gap-3 overflow-x-auto px-[6%] pb-8 [scrollbar-width:none] sm:gap-4 lg:px-[3%]"
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
                  // Cae al riel y se mece desde el gancho hasta quedar quieta.
                  initial={reduceMotion ? false : { opacity: 0, y: -28, rotate: i % 2 ? 7 : -7 }}
                  animate={{
                    // La prenda enfocada deja su lugar vacío (gancho incluido) mientras está en el centro.
                    opacity: focus === i ? 0 : dimmed ? 0.35 : 1,
                    y: 0,
                    rotate: 0,
                    filter: dimmed ? "blur(6px)" : "blur(0px)",
                    scale: dimmed ? 0.94 : 1,
                  }}
                  transition={{
                    ...SPRING_SETTLE,
                    rotate: SWING,
                    delay: focus === null && !reduceMotion ? 0.05 * i : 0,
                  }}
                  whileHover={reduceMotion || focus !== null ? undefined : { rotate: 2.5 }}
                  style={{ transformOrigin: "50% 0%" }}
                  className="group flex shrink-0 snap-center flex-col items-center rounded-lg focus-visible:ring-2 focus-visible:ring-orange focus-visible:outline-none"
                >
                  <HangingGarment hookWidth="calc(var(--rack-h) * 0.1)">
                    {focus === i ? (
                      // Hueco del mismo tamaño mientras la prenda está en el centro.
                      <span style={{ height: `calc(var(--rack-h) * ${HANG[product.kind]})` }} className="block aspect-[0.6]" />
                    ) : (
                      <motion.img
                        layoutId={garmentId(i)}
                        src={photoUrl(product, item.color)}
                        alt=""
                        draggable={false}
                        style={{ height: `calc(var(--rack-h) * ${HANG[product.kind]})` }}
                        className="relative w-auto object-contain drop-shadow-[0_10px_14px_rgba(33,31,32,0.18)] select-none"
                        transition={{ duration: 0.55, ease: EASE_OUT }}
                      />
                    )}
                  </HangingGarment>
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
  const [side, setSide] = useState<RoperoView>("front");
  const [size, setSize] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const tall = product.kind === "pant";

  function add() {
    if (!size) return;
    addItem(
      { productId: product.id, name: product.name, priceCOP: product.price, size, colorId: color, colorName: COLORS[color][0] },
      1,
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-14 pt-4 pb-6 sm:gap-6">
      <HangingGarment hookWidth={FOCUS_HOOK}>
        <motion.img
          layoutId={garmentId(index)}
          key={`${color}-${side}`}
          src={photoUrl(product, color, side)}
          alt={`${product.name} en ${COLORS[color][0]}, ${VIEWS.find((v) => v.id === side)?.alt}`}
          draggable={false}
          className={`relative w-auto object-contain drop-shadow-[0_18px_24px_rgba(33,31,32,0.22)] select-none ${
            tall ? "h-[min(46vh,420px)]" : "h-[min(36vh,340px)]"
          }`}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        />
      </HangingGarment>

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
          {VIEWS.map((v) => {
            const disabled = !hasView(product, v.id);
            return (
              <button
                key={v.id}
                type="button"
                disabled={disabled}
                aria-pressed={side === v.id}
                title={disabled ? "Foto en camino" : undefined}
                onClick={() => setSide(v.id)}
                className={`rounded-full px-4 py-1.5 transition focus-visible:ring-2 focus-visible:ring-orange focus-visible:outline-none ${
                  side === v.id ? "bg-ink text-paper" : "text-ink/70 hover:text-ink"
                } disabled:cursor-not-allowed disabled:text-ink/30`}
              >
                {v.label}
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
              // Las vistas son las mismas en todos los colores: cambiar de color no cambia de vista.
              onClick={() => setColor(c)}
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


/**
 * La prenda colgada de verdad: el gancho entra por el cuello y su base queda detrás de la foto.
 * Los brazos del gancho van por dentro de la prenda, así que solo se ve el gancho, como en un
 * ropero real; en el riel, la parte de arriba lo rodea.
 */
function HangingGarment({ hookWidth, children }: { hookWidth: string; children: ReactNode }) {
  return (
    <div className="relative flex flex-col items-center" style={{ paddingTop: `calc(${hookWidth} * ${HOOK_VISIBLE})` }}>
      <Hook style={{ width: hookWidth }} className="absolute top-0 left-1/2 -translate-x-1/2" />
      {children}
    </div>
  );
}

// Alto del gancho / ancho (viewBox 24×40), menos el tramo que se esconde detrás del cuello.
const HOOK_VISIBLE = (40 / 24) * 0.82;

function Hook({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 40" fill="none" aria-hidden="true" style={style} className={`text-metal-dark ${className}`}>
      <path
        d="M12 40V18.5c0-2.8 1.7-3.9 3.6-5.6 1.9-1.6 2.8-3.3 2.8-5.2A6.4 6.4 0 0 0 12 1.3a6.4 6.4 0 0 0-6.4 6.4"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
