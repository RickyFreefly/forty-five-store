import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll, useSpring, type MotionValue } from "motion/react";
import { coverRect, nearestLoaded, preloadOrder, progressToFrame } from "../lib/scrollSequence";

interface ScrollSequenceProps {
  /** Folder under /public holding 0001.webp … NNNN.webp, e.g. "/sequences/caida". */
  basePath: string;
  /** Lighter frames for narrow screens (same count and naming). Falls back to basePath. */
  mobileBasePath?: string;
  frameCount: number;
  extension?: string;
  /** Total section height in vh — more height = slower scrub. */
  heightVh?: number;
  /** Frame shown when the user prefers reduced motion. */
  staticFrame?: number;
  /** Accessible description of what the sequence shows. */
  label: string;
  id?: string;
  /** Overlay content, laid over the sticky canvas; receives the smoothed 0..1 progress. */
  children?: (progress: MotionValue<number>) => ReactNode;
}

const PRELOAD_CONCURRENCY = 6;
const MAX_DPR = 2;

function frameUrl(basePath: string, index: number, extension: string) {
  return `${basePath}/${String(index + 1).padStart(4, "0")}.${extension}`;
}

/**
 * Tall section with a sticky <canvas> that scrubs an image sequence with the scroll:
 * forwards on the way down, backwards on the way up, still when the scroll stops.
 * Frames preload progressively (every 4th first) once the section nears the viewport.
 */
export function ScrollSequence({
  basePath,
  mobileBasePath,
  frameCount,
  extension = "webp",
  heightVh = 400,
  staticFrame = 0,
  label,
  id,
  children,
}: ScrollSequenceProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const loadedRef = useRef<boolean[]>([]);
  const rafRef = useRef(0);
  const reduceMotion = useReducedMotion();

  const [path] = useState(() =>
    mobileBasePath && typeof window !== "undefined" && window.matchMedia?.("(max-width: 767px)").matches
      ? mobileBasePath
      : basePath,
  );

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  // Critically damped (c = 2√(k·m)): smooths wheel steps and settles without overshoot when the scroll stops.
  const progress = useSpring(scrollYProgress, { stiffness: 160, damping: 16, mass: 0.4, restDelta: 0.0001 });

  const progressRef = useRef(progress);
  progressRef.current = progress;

  const draw = () => {
    rafRef.current = 0;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const f = reduceMotion ? staticFrame : progressToFrame(progressRef.current.get(), frameCount);
    const i0 = Math.floor(f);
    const i1 = Math.min(i0 + 1, frameCount - 1);
    const t = f - i0;
    const base = nearestLoaded(i0, loadedRef.current);
    if (base < 0) return;

    const paint = (index: number, alpha: number) => {
      const img = imagesRef.current[index];
      if (!img) return;
      const r = coverRect(img.naturalWidth, img.naturalHeight, canvas.width, canvas.height);
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, r.dx, r.dy, r.dw, r.dh);
    };

    paint(base, 1);
    // Crossfade into the next frame for in-between scroll positions.
    if (t > 0.001 && i1 !== base && loadedRef.current[i1]) paint(i1, t);
    ctx.globalAlpha = 1;
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;

  const requestDraw = () => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(() => drawRef.current());
  };

  useMotionValueEvent(progress, "change", () => {
    if (!reduceMotion) requestDraw();
  });

  // Keep the backing store matched to the displayed size (capped DPR).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      requestDraw();
    };
    resize();
    // The canvas always fills the sticky viewport, so window resizes (incl. mobile URL bar) are enough.
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Progressive preload, started when the section is about one viewport away.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    imagesRef.current = new Array(frameCount).fill(null);
    loadedRef.current = new Array(frameCount).fill(false);
    let cancelled = false;

    const start = () => {
      // Reduced motion only ever needs the static frame.
      const queue = reduceMotion ? [staticFrame] : preloadOrder(frameCount);
      const next = () => {
        const index = queue.shift();
        if (index === undefined || cancelled) return;
        const img = new Image();
        img.decoding = "async";
        img.src = frameUrl(path, index, extension);
        img
          .decode()
          .then(() => {
            if (cancelled) return;
            imagesRef.current[index] = img;
            loadedRef.current[index] = true;
            requestDraw();
          })
          .catch(() => {})
          .finally(next);
      };
      for (let k = 0; k < PRELOAD_CONCURRENCY; k++) next();
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
      return () => {
        cancelled = true;
      };
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(section);

    return () => {
      cancelled = true;
      io.disconnect();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, frameCount, extension, reduceMotion, staticFrame]);

  return (
    <section ref={sectionRef} id={id} className="relative bg-ink" style={{ height: `${heightVh}svh` }}>
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        <canvas ref={canvasRef} role="img" aria-label={label} className="absolute inset-0 h-full w-full" />
        {children?.(progress)}
      </div>
    </section>
  );
}
