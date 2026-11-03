// @ts-nocheck
// El Ropero — motor de riel 3D, adaptado de un prototipo standalone (cp.html) a un módulo
// que se monta dentro de una sección de la landing de FORTY FIVE. Usa el carrito real del
// sitio (src/store/cart.ts) en vez de un carrito y checkout por WhatsApp propios.
import * as THREE from "three";
import { useCartStore, cartCount, type CartLine } from "../../store/cart";
import { formatCOP } from "../../data/products";
import { ROPERO_CFG, COLORS, PRODUCTS, PROD, PKEY, PRINT_AT, SECS, LOOK, GUIDES, SIZES, SIZE_SCALE } from "../../data/ropero";

export function mountRopero(root: HTMLElement): () => void {
  const T = THREE;
  const PI = Math.PI,
    TAU = PI * 2;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
  const sstep = (a: number, b: number, x: number) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  let seed = 20240611;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const DISPLAY = '"Unbounded","Arial Black",sans-serif';
  const MONO = '"IBM Plex Mono",ui-monospace,monospace';
  const BODY = '"Archivo",system-ui,sans-serif';

  const cleanups: Array<() => void> = [];
  function on(target: EventTarget, type: string, fn: any, opts?: any) {
    target.addEventListener(type, fn, opts);
    cleanups.push(() => target.removeEventListener(type, fn, opts));
  }
  const rafIds: number[] = [];
  function raf(fn: (t: number) => void) {
    const id = requestAnimationFrame(fn);
    rafIds.push(id);
    return id;
  }

  const $ = (s: string, r: ParentNode = root) => r.querySelector(s) as HTMLElement;
  const $$ = (s: string, r: ParentNode = root) => [...r.querySelectorAll(s)] as HTMLElement[];
  const fmt = (n: number) => formatCOP(Math.round(n));
  const esc = (s: unknown) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  const LS = {
    get(k: string, d: any) {
      try {
        const v = localStorage.getItem("ropero_" + k);
        return v == null ? d : JSON.parse(v);
      } catch {
        return d;
      }
    },
    set(k: string, v: any) {
      try {
        localStorage.setItem("ropero_" + k, JSON.stringify(v));
      } catch {
        /* ignore */
      }
    },
  };
  function colorInfo(key: string) {
    if (key && key.startsWith("custom:")) {
      const hex = key.slice(7);
      return { name: "Personalizado " + hex.toUpperCase() + " (bajo pedido)", hex };
    }
    const c = (COLORS as any)[key];
    return c ? { name: c[0], hex: c[1] } : { name: String(key), hex: "#888888" };
  }
  function hexLum(hex: string) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v: number) => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
  }
  const vw = () => root.clientWidth || 1;
  const vh = () => root.clientHeight || 1;
  const isPhone = () => vw() < 700;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ===================== Pantalla simple (sin WebGL) ===================== */
  function showFallback() {
    $("#fallback").hidden = false;
    ["#top", "#dock", "#loading", "#store", "#focusLabel", "#vig"].forEach((s) => {
      const e = $(s);
      if (e) {
        e.hidden = true;
        e.style.display = "none";
      }
    });
    $("#fbList").innerHTML = PRODUCTS.map(
      (p) =>
        `<div class="fb-item"><b>${esc(p.name)}</b><span class="pr">${fmt(p.price)}</span><span class="fine">${esc(p.desc)} Tallas: ${p.sizes.join(", ")}.</span><span class="sws" aria-label="${p.colors.length} colores">${p.colors
          .map((c) => `<i style="background:${colorInfo(c).hex}" title="${esc(colorInfo(c).name)}"></i>`)
          .join("")}</span></div>`,
    ).join("");
  }
  const hasGL = (() => {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      return false;
    }
  })();
  if (!hasGL) {
    showFallback();
    return () => {};
  }

  /* ===================== Three.js: base ===================== */
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: $("#store") as HTMLCanvasElement, antialias: true, powerPreference: "high-performance" });
  } catch {
    showFallback();
    return () => {};
  }
  renderer.outputEncoding = (T as any).sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setPixelRatio(Math.min(devicePixelRatio, isPhone() ? 1.6 : 2));
  const scene = new T.Scene();
  scene.background = new T.Color("#C9CFCF");
  scene.fog = new T.Fog("#C9CFCF", 26, 70);
  const cam = new T.PerspectiveCamera(45, vw() / vh(), 0.05, 120);

  /* ===================== Texturas generadas ===================== */
  function mkCanvas(w: number, h: number) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  function texFrom(c: HTMLCanvasElement, { srgb = false, rep = [1, 1] }: any = {}) {
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(rep[0], rep[1]);
    t.anisotropy = 8;
    if (srgb) (t as any).encoding = (T as any).sRGBEncoding;
    return t;
  }
  const matCache = new Map<string, THREE.Material>();
  function plainMat(hex: string, o: any = {}) {
    const k = "p" + hex + JSON.stringify(o);
    let m = matCache.get(k);
    if (!m) {
      m = new T.MeshStandardMaterial(Object.assign({ color: hex, roughness: 0.8, metalness: 0 }, o));
      matCache.set(k, m);
    }
    return m as THREE.MeshStandardMaterial;
  }
  const METAL = plainMat("#B9B4A8", { metalness: 0.85, roughness: 0.32 });
  const WOODM = plainMat("#C6A07A", { roughness: 0.5 });
  const M = (g: THREE.BufferGeometry, m: THREE.Material) => new T.Mesh(g, m);
  function tube(points: number[][], r: number, seg = 24, rad = 6) {
    return new T.TubeGeometry(new T.CatmullRomCurve3(points.map((p) => new T.Vector3(p[0], p[1], p[2]))), seg, r, rad, false);
  }

  /* ===================== Estampados propios ===================== */
  const printCache = new Map<string, THREE.Texture>();
  function printTex(kind: "brand" | "cap", ink: string, accent: string, aspect: number, label?: string) {
    const key = kind + ink + aspect.toFixed(2) + "|" + (label || "");
    if (printCache.has(key)) return printCache.get(key)!;
    const W = 512,
      H = Math.round(512 * aspect);
    const c = mkCanvas(W, H),
      g = c.getContext("2d")!;
    g.fillStyle = ink;
    g.strokeStyle = ink;
    g.textAlign = "center";
    g.textBaseline = "middle";
    if (kind === "brand") {
      g.font = `800 ${H * 0.44}px ${DISPLAY}`;
      g.fillText("45", W / 2, H * 0.38);
      g.fillStyle = accent;
      g.fillRect(W * 0.3, H * 0.6, W * 0.4, 5);
      g.fillStyle = ink;
      g.font = `600 ${H * 0.095}px ${MONO}`;
      g.fillText((label || "").toUpperCase(), W / 2, H * 0.74);
    } else {
      g.font = `800 ${H * 0.55}px ${DISPLAY}`;
      g.fillText("45", W / 2, H * 0.52);
    }
    const t = texFrom(c, { srgb: true });
    t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
    printCache.set(key, t);
    return t;
  }
  const printMatCache = new Map<string, THREE.Material>();
  function printInk(hex: string) {
    const light = hexLum(hex) > 0.32;
    return { ink: light ? "#1B1A18" : "#EFE9DC", acc: light ? "#A3412A" : "#F2B01E" };
  }
  function printMat(kind: "brand" | "cap", hex: string, aspect: number, label?: string) {
    const key = kind + "|" + hex + "|" + aspect + "|" + (label || "");
    if (printMatCache.has(key)) return printMatCache.get(key)!;
    const { ink, acc } = printInk(hex);
    const m = new T.MeshStandardMaterial({
      map: printTex(kind, ink, acc, aspect, label),
      transparent: true,
      roughness: 0.75,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      depthWrite: false,
      side: T.DoubleSide,
    });
    printMatCache.set(key, m);
    return m;
  }

  /* ===================== Caja de herramientas de pintura 2D ===================== */
  const PXM = isPhone() ? 820 : 1000;
  const PSPEC: Record<string, { w: number; t: number; b: number }> = {
    hoodie: { w: 0.86, t: -0.12, b: 0.75 },
    teeOv: { w: 1.0, t: -0.06, b: 0.78 },
    teeReg: { w: 0.84, t: -0.06, b: 0.74 },
    jogger: { w: 0.48, t: -0.02, b: 1.02 },
    cap: { w: 0.28, t: -0.01, b: 0.22 },
    hoodieS: { w: 0.44, t: -0.12, b: 0.75 },
    teeOvS: { w: 0.3, t: -0.06, b: 0.78 },
    teeRegS: { w: 0.28, t: -0.06, b: 0.74 },
    joggerS: { w: 0.34, t: -0.02, b: 1.02 },
  };
  const PB = "#e2e2e2",
    PBs = "#d6d6d6";
  function pc(key: string) {
    const sp = PSPEC[key],
      W = Math.ceil(sp.w * PXM),
      H = Math.ceil((sp.b - sp.t) * PXM),
      c = mkCanvas(W, H),
      g = c.getContext("2d")!;
    g.setTransform(PXM, 0, 0, PXM, W / 2, -sp.t * PXM);
    g.lineJoin = "round";
    g.lineCap = "round";
    return { c, g };
  }
  function psg(p: Path2D, s: any, m: number) {
    if (s[0] === "L") p.lineTo(m * s[1], s[2]);
    else if (s[0] === "Q") p.quadraticCurveTo(m * s[1], s[2], m * s[3], s[4]);
    else if (s[0] === "C") p.bezierCurveTo(m * s[1], s[2], m * s[3], s[4], m * s[5], s[6]);
  }
  function shape(segs: any[], m = 1, close = true) {
    const p = new Path2D();
    p.moveTo(m * segs[0][1], segs[0][2]);
    for (let i = 1; i < segs.length; i++) psg(p, segs[i], m);
    if (close) p.closePath();
    return p;
  }
  function sym(segs: any[]) {
    const p = new Path2D();
    p.moveTo(segs[0][1], segs[0][2]);
    for (let i = 1; i < segs.length; i++) psg(p, segs[i], 1);
    for (let i = segs.length - 1; i >= 1; i--) {
      const s = segs[i],
        pr = segs[i - 1],
        ex = -pr[pr.length - 2],
        ey = pr[pr.length - 1];
      if (s[0] === "L") p.lineTo(ex, ey);
      else if (s[0] === "Q") p.quadraticCurveTo(-s[1], s[2], ex, ey);
      else p.bezierCurveTo(-s[3], s[4], -s[1], s[2], ex, ey);
    }
    p.closePath();
    return p;
  }
  const KK = (a: number) => `rgba(0,0,0,${a})`;
  const WW = (a: number) => `rgba(255,255,255,${a})`;
  function soft(g: CanvasRenderingContext2D, blur: number, col: string, fn: (g: CanvasRenderingContext2D) => void) {
    const off = 30000;
    g.save();
    g.shadowColor = col;
    g.shadowBlur = Math.max(0.6, blur * PXM);
    (g as any).shadowOffsetX = off;
    g.translate(-off / PXM, 0);
    g.fillStyle = g.strokeStyle = "#000";
    fn(g);
    g.restore();
  }
  function cp(a: number[]) {
    const p = new Path2D();
    p.moveTo(a[0], a[1]);
    if (a.length === 4) p.lineTo(a[2], a[3]);
    else if (a.length === 6) p.quadraticCurveTo(a[2], a[3], a[4], a[5]);
    else p.bezierCurveTo(a[2], a[3], a[4], a[5], a[6], a[7]);
    return p;
  }
  function sline(g: CanvasRenderingContext2D, a: number[], w: number, col: string, blur: number) {
    const p = cp(a);
    soft(g, blur, col, (x) => {
      x.lineWidth = w;
      x.stroke(p);
    });
  }
  function crease(g: CanvasRenderingContext2D, a: number[], w = 0.006, k = 0.22, blur = 0.009) {
    sline(g, a, w, KK(k), blur);
    sline(
      g,
      a.map((v, i) => (i % 2 ? v + w * 1.1 : v + w * 0.5)),
      w * 0.7,
      WW(k * 0.85),
      blur * 0.9,
    );
  }
  function hi(g: CanvasRenderingContext2D, a: number[], w = 0.02, k = 0.18, blur = 0.02) {
    sline(g, a, w, WW(k), blur);
  }
  function dk(g: CanvasRenderingContext2D, a: number[], w = 0.02, k = 0.18, blur = 0.02) {
    sline(g, a, w, KK(k), blur);
  }
  function edgeAO(g: CanvasRenderingContext2D, path: Path2D, k = 0.3, blur = 0.03) {
    soft(g, blur, KK(k), (x) => {
      x.lineWidth = 0.004;
      x.stroke(path);
    });
  }
  function part(
    g: CanvasRenderingContext2D,
    path: Path2D,
    base: string,
    fn?: (g: CanvasRenderingContext2D) => void,
    cast = 0.28,
    cb = 0.02,
    dy = 0.006,
  ) {
    if (cast) {
      g.save();
      g.globalCompositeOperation = "source-atop";
      g.translate(0.003, dy);
      soft(g, cb, KK(cast), (x) => x.fill(path));
      g.restore();
    }
    g.save();
    g.fillStyle = base;
    g.fill(path);
    g.clip(path);
    fn && fn(g);
    g.restore();
  }
  function grad(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([o, c]) => gr.addColorStop(o, c));
    g.fillStyle = gr;
    g.fillRect(-2, -2, 4, 4);
  }
  function rgrad(g: CanvasRenderingContext2D, x: number, y: number, r: number, stops: [number, string][]) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    stops.forEach(([o, c]) => gr.addColorStop(o, c));
    g.fillStyle = gr;
    g.fillRect(-2, -2, 4, 4);
  }
  function ribs(g: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number, pitch = 0.0058, k = 0.15) {
    for (let x = x0; x < x1; x += pitch) {
      g.fillStyle = KK(k);
      g.fillRect(x, y0, pitch * 0.36, y1 - y0);
      g.fillStyle = WW(k * 0.8);
      g.fillRect(x + pitch * 0.55, y0, pitch * 0.22, y1 - y0);
    }
  }
  function radRibs(g: CanvasRenderingContext2D, cx: number, cy: number, r0: number, r1: number, step = 0.045, k = 0.16) {
    for (let a = 0; a < TAU; a += step) {
      g.strokeStyle = KK(k);
      g.lineWidth = 0.0019;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      g.stroke();
      const b = a + step * 0.5;
      g.strokeStyle = WW(k * 0.8);
      g.lineWidth = 0.0011;
      g.beginPath();
      g.moveTo(cx + Math.cos(b) * r0, cy + Math.sin(b) * r0);
      g.lineTo(cx + Math.cos(b) * r1, cy + Math.sin(b) * r1);
      g.stroke();
    }
  }
  function stitch(g: CanvasRenderingContext2D, a: number[], k = 0.26, dash = 0.0055) {
    const p = cp(a);
    g.save();
    g.setLineDash([dash, dash * 0.7]);
    g.lineWidth = 0.0014;
    g.strokeStyle = KK(k);
    g.stroke(p);
    g.translate(0, 0.0013);
    g.strokeStyle = WW(k * 1.1);
    g.stroke(p);
    g.restore();
  }
  let NOISE: HTMLCanvasElement | null = null;
  function noiseTile() {
    if (NOISE) return NOISE;
    const n = 128,
      c = mkCanvas(n, n),
      x = c.getContext("2d")!,
      d = x.createImageData(n, n);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.random() < 0.5 ? 0 : 255;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = Math.random() * 18;
    }
    x.putImageData(d, 0, 0);
    return (NOISE = c);
  }
  function finish(c: HTMLCanvasElement, g: CanvasRenderingContext2D) {
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "source-atop";
    const gr = g.createLinearGradient(0, 0, c.width * 0.6, c.height);
    gr.addColorStop(0, WW(0.1));
    gr.addColorStop(0.5, WW(0));
    gr.addColorStop(1, KK(0.12));
    g.fillStyle = gr;
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = g.createPattern(noiseTile(), "repeat")!;
    g.fillRect(0, 0, c.width, c.height);
    g.restore();
  }
  function cord(g: CanvasRenderingContext2D, a: number[], w = 0.011) {
    const p = cp(a);
    g.save();
    g.translate(0.006, 0.005);
    soft(g, 0.008, KK(0.3), (x) => {
      x.lineWidth = w;
      x.stroke(p);
    });
    g.restore();
    g.save();
    g.lineWidth = w;
    g.strokeStyle = PB;
    g.stroke(p);
    g.lineWidth = w * 0.3;
    g.strokeStyle = WW(0.35);
    g.translate(-w * 0.22, 0);
    g.stroke(p);
    g.translate(w * 0.5, 0);
    g.strokeStyle = KK(0.22);
    g.stroke(p);
    g.restore();
  }
  function aglet(g: CanvasRenderingContext2D, x: number, y: number) {
    g.save();
    g.fillStyle = "#c4c4c4";
    g.beginPath();
    if (g.roundRect) g.roundRect(x - 0.0065, y, 0.013, 0.032, 0.003);
    else g.rect(x - 0.0065, y, 0.013, 0.032);
    g.fill();
    g.fillStyle = WW(0.55);
    g.fillRect(x - 0.004, y + 0.003, 0.003, 0.026);
    g.fillStyle = KK(0.25);
    g.fillRect(x + 0.003, y + 0.002, 0.0025, 0.028);
    g.restore();
  }

  /* ---- Buso con capota (hoodie), de frente ---- */
  function pLong(o: any) {
    const { c, g } = pc(o.key);
    if (o.hood) {
      const hood = sym([
        ["M", 0, -0.105],
        ["C", 0.1, -0.105, 0.17, -0.075, 0.17, -0.005],
        ["C", 0.17, 0.06, 0.142, 0.102, 0.11, 0.126],
        ["L", 0, 0.126],
      ]);
      part(
        g,
        hood,
        PBs,
        (x) => {
          grad(x, 0, -0.105, 0, 0.12, [
            [0, WW(0.14)],
            [0.55, KK(0)],
            [1, KK(0.28)],
          ]);
          edgeAO(x, hood, 0.3, 0.03);
          hi(x, [-0.12, -0.06, -0.06, -0.095, 0, -0.098], 0.02, 0.2, 0.02);
        },
        0,
      );
    }
    for (const m of [-1, 1]) {
      const sl = shape(
        [
          ["M", 0.25, 0.11],
          ["Q", 0.305, 0.093, 0.34, 0.128],
          ["C", 0.378, 0.17, 0.398, 0.3, 0.398, 0.42],
          ["C", 0.398, 0.5, 0.39, 0.56, 0.385, 0.602],
          ["L", 0.312, 0.607],
          ["C", 0.305, 0.5, 0.292, 0.35, 0.268, 0.25],
        ],
        m,
      );
      part(
        g,
        sl,
        PBs,
        (x) => {
          const a = m > 0 ? 0.27 : -0.4,
            b = m > 0 ? 0.4 : -0.27;
          grad(
            x,
            a,
            0,
            b,
            0,
            m > 0
              ? [
                  [0, KK(0.26)],
                  [0.4, WW(0.08)],
                  [0.72, KK(0.02)],
                  [1, KK(0.24)],
                ]
              : [
                  [0, KK(0.24)],
                  [0.28, KK(0.02)],
                  [0.6, WW(0.08)],
                  [1, KK(0.26)],
                ],
          );
          edgeAO(x, sl, 0.3, 0.025);
          hi(x, [m * 0.35, 0.16, m * 0.365, 0.34, m * 0.357, 0.5], 0.014, 0.16, 0.022);
          crease(x, [m * 0.36, 0.44, m * 0.372, 0.48, m * 0.394, 0.5], 0.004, 0.18);
          crease(x, [m * 0.318, 0.53, m * 0.35, 0.548, m * 0.39, 0.54], 0.004, 0.2);
          crease(x, [m * 0.316, 0.575, m * 0.352, 0.565, m * 0.388, 0.58], 0.004, 0.22);
          dk(x, [m * 0.32, 0.3, m * 0.31, 0.45, m * 0.316, 0.6], 0.012, 0.14, 0.02);
        },
        0,
      );
      const cf = shape(
        [
          ["M", 0.313, 0.6],
          ["L", 0.384, 0.596],
          ["Q", 0.389, 0.6, 0.388, 0.61],
          ["L", 0.383, 0.672],
          ["Q", 0.382, 0.68, 0.372, 0.681],
          ["L", 0.323, 0.684],
          ["Q", 0.314, 0.684, 0.313, 0.676],
        ],
        m,
      );
      part(
        g,
        cf,
        PB,
        (x) => {
          ribs(x, -0.4, 0.4, 0.59, 0.69);
          grad(x, 0, 0.596, 0, 0.684, [
            [0, KK(0.3)],
            [0.16, KK(0)],
            [0.85, KK(0)],
            [1, KK(0.22)],
          ]);
          grad(x, m * 0.31, 0, m * 0.39, 0, [
            [0, KK(0.16)],
            [0.4, WW(0.06)],
            [1, KK(0.2)],
          ]);
          edgeAO(x, cf, 0.25, 0.012);
        },
        0.3,
        0.012,
      );
    }
    const body = sym([
      ["M", 0, 0.085],
      ["Q", 0.075, 0.08, 0.097, 0],
      ["Q", 0.19, 0.038, 0.29, 0.104],
      ["C", 0.31, 0.13, 0.305, 0.2, 0.3, 0.26],
      ["C", 0.298, 0.4, 0.3, 0.55, 0.292, 0.648],
      ["Q", 0.29, 0.662, 0.27, 0.664],
      ["L", 0, 0.664],
    ]);
    part(
      g,
      body,
      PB,
      (x) => {
        grad(x, -0.3, 0, 0.3, 0, [
          [0, KK(0.22)],
          [0.18, KK(0.02)],
          [0.42, WW(0.08)],
          [0.75, KK(0.03)],
          [1, KK(0.22)],
        ]);
        edgeAO(x, body, 0.3, 0.035);
        grad(x, 0, 0, 0, 0.66, [
          [0, WW(0.06)],
          [0.5, KK(0)],
          [1, KK(0.08)],
        ]);
        for (const m of [-1, 1]) {
          crease(x, [m * 0.262, 0.125, m * 0.2, 0.2, m * 0.13, 0.29], 0.006, 0.15, 0.012);
          hi(x, [m * 0.1, 0.055, m * 0.18, 0.068, m * 0.27, 0.108], 0.014, 0.22, 0.012);
          crease(x, [m * 0.288, 0.27, m * 0.25, 0.33, m * 0.2, 0.38], 0.005, 0.13, 0.01);
          crease(x, [m * 0.22, 0.47, m * 0.214, 0.56, m * 0.226, 0.64], 0.005, 0.09, 0.012);
          stitch(x, [m * 0.272, 0.108, m * 0.286, 0.18, m * 0.285, 0.27], 0.22);
          dk(x, [m * 0.29, 0.3, m * 0.285, 0.45, m * 0.29, 0.62], 0.02, 0.1, 0.025);
        }
        hi(x, [-0.06, 0.3, -0.07, 0.45, -0.05, 0.6], 0.05, 0.08, 0.05);
      },
      0.34,
      0.022,
    );
    if (o.pocket) {
      const pk = sym([
        ["M", 0, 0.405],
        ["L", 0.168, 0.405],
        ["L", 0.232, 0.565],
        ["Q", 0.24, 0.6, 0.238, 0.628],
        ["L", 0, 0.63],
      ]);
      part(
        g,
        pk,
        PB,
        (x) => {
          grad(x, 0, 0.405, 0, 0.63, [
            [0, WW(0.09)],
            [0.5, KK(0)],
            [1, KK(0.1)],
          ]);
          grad(x, -0.24, 0, 0.24, 0, [
            [0, KK(0.12)],
            [0.4, WW(0.04)],
            [1, KK(0.12)],
          ]);
          edgeAO(x, pk, 0.22, 0.02);
          for (const m of [-1, 1]) {
            sline(x, [m * 0.168, 0.405, m * 0.232, 0.565], 0.007, KK(0.5), 0.006);
            sline(x, [m * 0.162, 0.413, m * 0.225, 0.57], 0.003, WW(0.28), 0.003);
            stitch(x, [m * 0.153, 0.415, m * 0.216, 0.572], 0.2);
          }
          stitch(x, [-0.163, 0.415, 0.163, 0.415], 0.22);
          stitch(x, [-0.161, 0.421, 0.161, 0.421], 0.18);
          crease(x, [-0.13, 0.51, 0, 0.525, 0.13, 0.51], 0.005, 0.08, 0.02);
        },
        0.4,
        0.012,
        0.008,
      );
    }
    const band = sym([
      ["M", 0, 0.645],
      ["L", 0.274, 0.645],
      ["Q", 0.285, 0.648, 0.284, 0.66],
      ["L", 0.281, 0.705],
      ["Q", 0.279, 0.716, 0.266, 0.717],
      ["L", 0, 0.717],
    ]);
    part(
      g,
      band,
      PB,
      (x) => {
        ribs(x, -0.3, 0.3, 0.64, 0.72);
        grad(x, 0, 0.645, 0, 0.717, [
          [0, KK(0.32)],
          [0.18, KK(0)],
          [0.8, KK(0)],
          [1, KK(0.22)],
        ]);
        grad(x, -0.3, 0, 0.3, 0, [
          [0, KK(0.18)],
          [0.45, WW(0.05)],
          [1, KK(0.18)],
        ]);
        edgeAO(x, band, 0.25, 0.012);
      },
      0.32,
      0.012,
    );
    if (o.hood) {
      const inner = sym([
        ["M", 0, -0.072],
        ["C", 0.075, -0.072, 0.126, -0.05, 0.128, 0],
        ["C", 0.13, 0.05, 0.09, 0.085, 0, 0.102],
      ]);
      const outer = sym([
        ["M", 0, -0.094],
        ["C", 0.095, -0.094, 0.152, -0.062, 0.153, 0],
        ["C", 0.155, 0.065, 0.11, 0.112, 0, 0.127],
      ]);
      g.save();
      g.globalCompositeOperation = "source-atop";
      g.translate(0.003, 0.008);
      soft(g, 0.018, KK(0.32), (x) => x.fill(outer));
      g.restore();
      part(
        g,
        inner,
        "#9a9a9a",
        (x) => {
          grad(x, 0, -0.075, 0, 0.1, [
            [0, KK(0.42)],
            [0.55, KK(0.16)],
            [1, KK(0.04)],
          ]);
          edgeAO(x, inner, 0.45, 0.03);
          hi(x, [-0.06, 0.075, 0, 0.088, 0.06, 0.075], 0.018, 0.12, 0.02);
        },
        0,
      );
      const rim = new Path2D();
      rim.addPath(outer);
      rim.addPath(inner);
      g.save();
      g.fillStyle = PB;
      g.fill(rim, "evenodd");
      g.clip(rim, "evenodd");
      grad(g, 0, -0.094, 0, 0.127, [
        [0, WW(0.14)],
        [0.5, KK(0)],
        [1, KK(0.1)],
      ]);
      grad(g, -0.16, 0, 0.16, 0, [
        [0, KK(0.2)],
        [0.35, WW(0.05)],
        [0.65, KK(0)],
        [1, KK(0.2)],
      ]);
      edgeAO(g, outer, 0.25, 0.012);
      edgeAO(g, inner, 0.4, 0.012);
      soft(g, 0.004, WW(0.35), (x) => {
        x.lineWidth = 0.0025;
        x.stroke(inner);
      });
      g.restore();
      crease(g, [-0.04, 0.09, 0, 0.108, 0.035, 0.128], 0.004, 0.3, 0.006);
      for (const m of [-1, 1]) {
        g.save();
        g.fillStyle = "#8e8e8e";
        g.beginPath();
        g.ellipse(m * 0.05, 0.1, 0.0075, 0.006, 0, 0, TAU);
        g.fill();
        g.fillStyle = "#3c3c3c";
        g.beginPath();
        g.ellipse(m * 0.05, 0.1, 0.0042, 0.0034, 0, 0, TAU);
        g.fill();
        g.restore();
        cord(g, [m * 0.05, 0.1, m * 0.06, 0.19, m * 0.046, 0.28, m * 0.055, 0.352]);
        aglet(g, m * 0.055, 0.345);
      }
    } else {
      const outer = sym([
        ["M", 0, -0.036],
        ["Q", 0.072, -0.036, 0.126, 0],
        ["Q", 0.1, 0.116, 0, 0.12],
      ]);
      const inner = sym([
        ["M", 0, -0.012],
        ["Q", 0.055, -0.012, 0.097, 0],
        ["Q", 0.075, 0.08, 0, 0.085],
      ]);
      part(
        g,
        inner,
        "#a2a2a2",
        (x) => {
          grad(x, 0, -0.012, 0, 0.085, [
            [0, KK(0.4)],
            [1, KK(0.08)],
          ]);
          edgeAO(x, inner, 0.4, 0.02);
        },
        0,
      );
      const rim = new Path2D();
      rim.addPath(outer);
      rim.addPath(inner);
      g.save();
      g.globalCompositeOperation = "source-atop";
      g.translate(0.002, 0.005);
      soft(g, 0.012, KK(0.3), (x) => x.fill(outer));
      g.restore();
      g.save();
      g.fillStyle = PB;
      g.fill(rim, "evenodd");
      g.clip(rim, "evenodd");
      radRibs(g, 0, 0.04, 0.03, 0.16);
      grad(g, -0.13, 0, 0.13, 0, [
        [0, KK(0.22)],
        [0.4, WW(0.07)],
        [1, KK(0.2)],
      ]);
      edgeAO(g, outer, 0.25, 0.01);
      edgeAO(g, inner, 0.35, 0.01);
      g.restore();
    }
    finish(c, g);
    return { c };
  }
  /* ---- Buso de perfil ---- */
  function pLongSide(o: any) {
    const { c, g } = pc(o.key);
    if (o.hood) {
      const hood = shape([
        ["M", -0.02, -0.1],
        ["C", -0.12, -0.104, -0.19, -0.04, -0.182, 0.05],
        ["C", -0.176, 0.14, -0.13, 0.22, -0.098, 0.262],
        ["L", -0.05, 0.1],
      ]);
      part(
        g,
        hood,
        PBs,
        (x) => {
          grad(x, -0.19, 0, -0.02, 0, [
            [0, KK(0.25)],
            [0.45, WW(0.08)],
            [1, KK(0.05)],
          ]);
          edgeAO(x, hood, 0.3, 0.03);
          crease(x, [-0.16, 0.02, -0.12, 0.08, -0.1, 0.18], 0.006, 0.18, 0.014);
        },
        0,
      );
    }
    const body = shape([
      ["M", 0.066, 0.015],
      ["Q", 0.02, -0.004, -0.06, 0.02],
      ["C", -0.09, 0.1, -0.104, 0.3, -0.104, 0.45],
      ["L", -0.1, 0.648],
      ["L", 0.09, 0.648],
      ["C", 0.112, 0.6, 0.118, 0.5, 0.112, 0.42],
      ["C", 0.108, 0.3, 0.1, 0.16, 0.066, 0.015],
    ]);
    part(
      g,
      body,
      PB,
      (x) => {
        grad(x, -0.105, 0, 0.115, 0, [
          [0, KK(0.26)],
          [0.35, KK(0.02)],
          [0.7, WW(0.06)],
          [1, KK(0.22)],
        ]);
        edgeAO(x, body, 0.3, 0.03);
        if (o.hood) dk(x, [0.11, 0.41, 0.118, 0.5, 0.112, 0.62], 0.012, 0.16, 0.012);
      },
      0.3,
      0.02,
    );
    const band = shape([
      ["M", -0.1, 0.645],
      ["L", 0.09, 0.645],
      ["Q", 0.094, 0.65, 0.093, 0.66],
      ["L", 0.09, 0.706],
      ["Q", 0.088, 0.716, 0.078, 0.716],
      ["L", -0.088, 0.716],
      ["Q", -0.098, 0.716, -0.098, 0.706],
    ]);
    part(
      g,
      band,
      PB,
      (x) => {
        ribs(x, -0.11, 0.1, 0.64, 0.72);
        grad(x, 0, 0.645, 0, 0.716, [
          [0, KK(0.3)],
          [0.2, KK(0)],
          [1, KK(0.2)],
        ]);
        grad(x, -0.1, 0, 0.095, 0, [
          [0, KK(0.22)],
          [0.6, WW(0.05)],
          [1, KK(0.2)],
        ]);
      },
      0.3,
      0.012,
    );
    if (o.hood) {
      const inn = shape([
        ["M", -0.028, -0.085],
        ["C", 0.03, -0.078, 0.07, -0.02, 0.07, 0.05],
        ["L", 0.02, 0.032],
        ["Q", -0.015, -0.015, -0.028, -0.085],
      ]);
      part(
        g,
        inn,
        "#909090",
        (x) => {
          grad(x, -0.03, 0, 0.07, 0, [
            [0, KK(0.45)],
            [1, KK(0.1)],
          ]);
        },
        0.25,
        0.012,
      );
      const rimP = cp([-0.02, -0.1, 0.05, -0.092, 0.085, -0.02, 0.074, 0.06]);
      soft(g, 0.006, KK(0.3), (x) => {
        x.lineWidth = 0.02;
        x.stroke(rimP);
      });
      g.save();
      g.lineWidth = 0.017;
      g.strokeStyle = PB;
      g.stroke(rimP);
      g.lineWidth = 0.004;
      g.strokeStyle = WW(0.3);
      g.translate(-0.004, 0);
      g.stroke(rimP);
      g.restore();
      cord(g, [0.074, 0.075, 0.088, 0.16, 0.082, 0.26, 0.094, 0.34]);
      aglet(g, 0.094, 0.333);
    } else {
      const col = shape([
        ["M", 0.07, 0.012],
        ["Q", 0.02, -0.01, -0.062, 0.016],
        ["L", -0.06, 0.04],
        ["Q", 0.02, 0.016, 0.068, 0.04],
      ]);
      part(
        g,
        col,
        PB,
        (x) => {
          ribs(x, -0.07, 0.08, -0.02, 0.05, 0.005, 0.13);
          grad(x, 0, -0.01, 0, 0.04, [
            [0, WW(0.1)],
            [1, KK(0.2)],
          ]);
        },
        0.3,
        0.01,
      );
    }
    const sl = shape([
      ["M", -0.062, 0.07],
      ["C", -0.01, 0.035, 0.06, 0.055, 0.078, 0.12],
      ["C", 0.088, 0.25, 0.078, 0.45, 0.064, 0.6],
      ["L", -0.046, 0.606],
      ["C", -0.062, 0.45, -0.072, 0.25, -0.062, 0.07],
    ]);
    part(
      g,
      sl,
      PB,
      (x) => {
        grad(x, -0.07, 0, 0.085, 0, [
          [0, KK(0.24)],
          [0.4, WW(0.1)],
          [0.75, KK(0.02)],
          [1, KK(0.26)],
        ]);
        edgeAO(x, sl, 0.3, 0.025);
        hi(x, [-0.03, 0.08, 0.02, 0.07, 0.06, 0.11], 0.016, 0.2, 0.014);
        crease(x, [-0.055, 0.36, 0, 0.38, 0.07, 0.35], 0.006, 0.18, 0.012);
        crease(x, [-0.05, 0.52, 0.0, 0.545, 0.066, 0.53], 0.005, 0.2);
        crease(x, [-0.047, 0.57, 0, 0.585, 0.064, 0.575], 0.004, 0.22);
      },
      0.38,
      0.022,
      0.004,
    );
    const cf = shape([
      ["M", -0.045, 0.6],
      ["L", 0.064, 0.597],
      ["Q", 0.069, 0.6, 0.068, 0.61],
      ["L", 0.064, 0.672],
      ["Q", 0.062, 0.682, 0.052, 0.682],
      ["L", -0.035, 0.684],
      ["Q", -0.045, 0.684, -0.045, 0.674],
    ]);
    part(
      g,
      cf,
      PB,
      (x) => {
        ribs(x, -0.05, 0.07, 0.59, 0.69);
        grad(x, 0, 0.597, 0, 0.684, [
          [0, KK(0.3)],
          [0.18, KK(0)],
          [1, KK(0.22)],
        ]);
        grad(x, -0.05, 0, 0.07, 0, [
          [0, KK(0.2)],
          [0.45, WW(0.06)],
          [1, KK(0.22)],
        ]);
      },
      0.3,
      0.012,
    );
    finish(c, g);
    return { c };
  }
  /* ---- Camisetas, de frente/perfil ---- */
  const TEE_OV = {
    key: "teeOv",
    hw: 0.3,
    sh: 0.1,
    hem: 0.74,
    sl: [
      ["M", 0.26, 0.095],
      ["Q", 0.38, 0.125, 0.47, 0.262],
      ["Q", 0.478, 0.278, 0.467, 0.29],
      ["L", 0.398, 0.385],
      ["Q", 0.386, 0.396, 0.372, 0.389],
      ["Q", 0.33, 0.372, 0.288, 0.36],
    ],
    st: [0.449, 0.277, 0.38, 0.372],
  };
  const TEE_REG = {
    key: "teeReg",
    hw: 0.255,
    sh: 0.095,
    hem: 0.7,
    sl: [
      ["M", 0.22, 0.09],
      ["Q", 0.31, 0.11, 0.385, 0.21],
      ["Q", 0.392, 0.225, 0.383, 0.236],
      ["L", 0.335, 0.315],
      ["Q", 0.326, 0.325, 0.312, 0.32],
      ["Q", 0.285, 0.31, 0.25, 0.3],
    ],
    st: [0.366, 0.226, 0.318, 0.305],
  };
  function pTee(o: any) {
    const { c, g } = pc(o.key),
      hw = o.hw,
      sh = o.sh,
      hem = o.hem;
    const backN = sym([
      ["M", 0, -0.034],
      ["Q", 0.07, -0.034, 0.12, 0],
      ["L", 0.1, 0.06],
      ["L", 0, 0.06],
    ]);
    part(
      g,
      backN,
      "#a4a4a4",
      (x) => {
        grad(x, 0, -0.03, 0, 0.06, [
          [0, KK(0.38)],
          [1, KK(0.1)],
        ]);
      },
      0,
    );
    for (const m of [-1, 1]) {
      const sl = shape(o.sl, m);
      part(
        g,
        sl,
        PBs,
        (x) => {
          const s = o.sl;
          grad(x, m * s[0][1], s[0][2], m * s[3][1], s[3][2], [
            [0, KK(0.18)],
            [0.45, WW(0.08)],
            [1, KK(0.2)],
          ]);
          edgeAO(x, sl, 0.3, 0.022);
          stitch(x, [m * o.st[0], o.st[1], m * o.st[2], o.st[3]], 0.24);
          crease(x, [m * (hw + 0.02), o.sh + 0.06, m * (hw + 0.06), o.sh + 0.12, m * (o.st[0] - 0.03), o.st[1] + 0.02], 0.005, 0.16, 0.012);
          hi(x, [m * (hw + 0.0), o.sh + 0.02, m * (hw + 0.08), o.sh + 0.06, m * (o.st[0] - 0.01), o.st[1] - 0.02], 0.012, 0.18, 0.014);
        },
        0,
      );
    }
    const body = sym([
      ["M", 0, 0.085],
      ["Q", 0.075, 0.08, 0.097, 0],
      ["Q", 0.19, 0.035, hw - 0.005, sh],
      ["C", hw + 0.01, sh + 0.08, hw + 0.002, sh + 0.2, hw - 0.002, sh + 0.26],
      ["C", hw - 0.003, 0.5, hw + 0.002, hem - 0.1, hw + 0.003, hem - 0.005],
      ["Q", hw, hem + 0.006, hw - 0.02, hem + 0.006],
      ["Q", hw * 0.5, hem + 0.012, 0, hem + 0.012],
    ]);
    part(
      g,
      body,
      PB,
      (x) => {
        grad(x, -hw, 0, hw, 0, [
          [0, KK(0.2)],
          [0.18, KK(0.02)],
          [0.42, WW(0.08)],
          [0.78, KK(0.03)],
          [1, KK(0.2)],
        ]);
        edgeAO(x, body, 0.28, 0.03);
        grad(x, 0, 0, 0, hem, [
          [0, WW(0.06)],
          [0.6, KK(0)],
          [1, KK(0.07)],
        ]);
        for (const m of [-1, 1]) {
          crease(x, [m * (hw - 0.04), sh + 0.02, m * (hw * 0.66), sh + 0.1, m * hw * 0.4, sh + 0.2], 0.006, 0.14, 0.012);
          hi(x, [m * 0.1, 0.05, m * (hw * 0.6), 0.06, m * (hw - 0.02), sh + 0.005], 0.014, 0.22, 0.012);
          crease(x, [m * (hw - 0.01), sh + 0.27, m * (hw - 0.05), sh + 0.33, m * (hw - 0.11), sh + 0.36], 0.005, 0.12, 0.01);
          crease(x, [m * hw * 0.5, hem - 0.28, m * hw * 0.48, hem - 0.14, m * hw * 0.53, hem], 0.005, 0.08, 0.014);
          stitch(x, [m * (hw - 0.015), sh, m * (hw - 0.004), sh + 0.12, m * (hw - 0.006), sh + 0.26], 0.18);
        }
        hi(x, [-hw * 0.45, 0.2, 0, 0.24, hw * 0.45, 0.2], 0.03, 0.1, 0.03);
        dk(x, [-hw * 0.5, 0.28, 0, 0.31, hw * 0.5, 0.28], 0.02, 0.06, 0.03);
        stitch(x, [-hw + 0.01, hem - 0.01, 0, hem - 0.003, hw - 0.01, hem - 0.01], 0.22);
      },
      0.32,
      0.022,
    );
    const outer = sym([
      ["M", 0, -0.03],
      ["Q", 0.07, -0.03, 0.116, 0],
      ["Q", 0.093, 0.1, 0, 0.104],
    ]);
    const inner = sym([
      ["M", 0, -0.014],
      ["Q", 0.055, -0.014, 0.097, 0],
      ["Q", 0.075, 0.08, 0, 0.085],
    ]);
    const rim = new Path2D();
    rim.addPath(outer);
    rim.addPath(inner);
    g.save();
    g.globalCompositeOperation = "source-atop";
    g.translate(0.002, 0.004);
    soft(g, 0.01, KK(0.25), (x) => x.fill(outer));
    g.restore();
    g.save();
    g.fillStyle = PB;
    g.fill(rim, "evenodd");
    g.clip(rim, "evenodd");
    radRibs(g, 0, 0.04, 0.03, 0.15, 0.05, 0.13);
    grad(g, -0.12, 0, 0.12, 0, [
      [0, KK(0.2)],
      [0.4, WW(0.07)],
      [1, KK(0.18)],
    ]);
    edgeAO(g, outer, 0.22, 0.008);
    edgeAO(g, inner, 0.32, 0.008);
    g.restore();
    finish(c, g);
    return { c };
  }
  function pTeeSide(key: string, d: number, hem: number) {
    const { c, g } = pc(key);
    const body = shape([
      ["M", 0.036, 0.03],
      ["Q", 0.0, 0.004, -0.04, 0.012],
      ["C", -0.046, 0.2, -0.05, 0.5, -0.047, hem],
      ["L", 0.047, hem],
      ["C", 0.052, 0.5, 0.05, 0.25, 0.036, 0.03],
    ]);
    part(
      g,
      body,
      PB,
      (x) => {
        grad(x, -0.05, 0, 0.052, 0, [
          [0, KK(0.26)],
          [0.4, KK(0.03)],
          [0.7, WW(0.06)],
          [1, KK(0.24)],
        ]);
        edgeAO(x, body, 0.28, 0.02);
        crease(x, [-0.02, 0.45, -0.025, 0.6, -0.02, hem], 0.004, 0.1);
        stitch(x, [-0.046, hem - 0.012, 0.046, hem - 0.012], 0.2);
      },
      0.3,
      0.02,
    );
    const sl = shape([
      ["M", -0.05, 0.04],
      ["C", -0.01, 0.004, 0.06, 0.018, 0.074, 0.075],
      ["C", 0.086, 0.14, 0.084, d - 0.05, 0.072, d - 0.004],
      ["Q", 0.012, d + 0.03, -0.052, d + 0.008],
      ["C", -0.068, d - 0.07, -0.07, 0.11, -0.05, 0.04],
    ]);
    part(
      g,
      sl,
      PB,
      (x) => {
        rgrad(x, 0.0, 0.12, 0.16, [
          [0, WW(0.12)],
          [0.55, KK(0.02)],
          [1, KK(0.3)],
        ]);
        edgeAO(x, sl, 0.3, 0.022);
        hi(x, [-0.03, 0.045, 0.02, 0.03, 0.06, 0.08], 0.014, 0.2, 0.014);
        crease(x, [-0.045, 0.15, 0, 0.19, 0.06, 0.16], 0.006, 0.13);
        stitch(x, [-0.05, d - 0.012, 0.01, d + 0.004, 0.07, d - 0.02], 0.22);
      },
      0.38,
      0.02,
      0.004,
    );
    const op = new Path2D();
    op.ellipse(0.01, d + 0.006, 0.06, 0.01, -0.18, 0, TAU);
    part(
      g,
      op,
      "#8a8a8a",
      (x) => {
        grad(x, 0, d - 0.01, 0, d + 0.02, [
          [0, KK(0.35)],
          [1, KK(0.05)],
        ]);
      },
      0,
    );
    const col = shape([
      ["M", 0.04, 0.028],
      ["Q", 0.0, -0.004, -0.044, 0.008],
      ["L", -0.042, 0.026],
      ["Q", 0.0, 0.014, 0.038, 0.046],
    ]);
    part(
      g,
      col,
      PB,
      (x) => {
        ribs(x, -0.05, 0.05, -0.01, 0.06, 0.005, 0.13);
        grad(x, 0, 0, 0, 0.05, [
          [0, WW(0.1)],
          [1, KK(0.2)],
        ]);
      },
      0.25,
      0.008,
    );
    finish(c, g);
    return { c };
  }
  /* ---- Jogger, de frente/perfil ---- */
  function pJogger() {
    const { c, g } = pc("jogger");
    const body = sym([
      ["M", 0, 0.05],
      ["L", 0.192, 0.05],
      ["C", 0.204, 0.12, 0.212, 0.2, 0.21, 0.28],
      ["C", 0.206, 0.5, 0.19, 0.75, 0.166, 0.915],
      ["L", 0.036, 0.925],
      ["C", 0.03, 0.75, 0.02, 0.5, 0.012, 0.33],
      ["Q", 0.006, 0.302, 0, 0.3],
    ]);
    part(
      g,
      body,
      PB,
      (x) => {
        edgeAO(x, body, 0.3, 0.03);
        for (const m of [-1, 1]) {
          grad(x, m * 0.01, 0, m * 0.21, 0, [
            [0, KK(0.22)],
            [0.3, WW(0.06)],
            [0.6, WW(0.02)],
            [1, KK(0.24)],
          ]);
          hi(x, [m * 0.1, 0.12, m * 0.105, 0.3, m * 0.1, 0.5], 0.05, 0.1, 0.05);
          crease(x, [m * 0.03, 0.33, m * 0.08, 0.3, m * 0.15, 0.24], 0.005, 0.16, 0.01);
          crease(x, [m * 0.03, 0.37, m * 0.09, 0.34, m * 0.17, 0.3], 0.004, 0.1, 0.012);
          crease(x, [m * 0.05, 0.55, m * 0.1, 0.58, m * 0.18, 0.54], 0.006, 0.14, 0.016);
          crease(x, [m * 0.045, 0.62, m * 0.11, 0.6, m * 0.175, 0.64], 0.005, 0.1, 0.016);
          for (const [y, k] of [
            [0.79, 0.14],
            [0.825, 0.18],
            [0.855, 0.2],
            [0.885, 0.22],
          ])
            crease(x, [m * 0.035, y, m * 0.1, y + 0.014, m * 0.17, y - 0.006], 0.005, k, 0.008);
          sline(x, [m * 0.15, 0.06, m * 0.2, 0.2], 0.006, KK(0.45), 0.006);
          sline(x, [m * 0.146, 0.068, m * 0.194, 0.204], 0.003, WW(0.28), 0.003);
          stitch(x, [m * 0.142, 0.07, m * 0.188, 0.205], 0.18);
          stitch(x, [m * 0.208, 0.27, m * 0.196, 0.6, m * 0.168, 0.91], 0.14);
        }
        dk(x, [0, 0.06, 0, 0.2, 0, 0.3], 0.004, 0.3, 0.006);
        stitch(x, [0.003, 0.06, 0.004, 0.2, 0.002, 0.29], 0.18);
        grad(x, 0, 0.04, 0, 0.12, [
          [0, KK(0.2)],
          [1, KK(0)],
        ]);
      },
      0,
    );
    const wb = sym([
      ["M", 0, 0],
      ["L", 0.19, 0],
      ["Q", 0.195, 0, 0.195, 0.006],
      ["L", 0.197, 0.055],
      ["L", 0, 0.055],
    ]);
    part(
      g,
      wb,
      PB,
      (x) => {
        ribs(x, -0.2, 0.2, -0.01, 0.06, 0.0055, 0.12);
        for (let i = -0.19; i < 0.19; i += 0.011 + Math.random() * 0.01) {
          dk(x, [i, 0.004, i + 0.002, 0.05], 0.003, 0.22, 0.004);
          hi(x, [i + 0.005, 0.004, i + 0.006, 0.05], 0.002, 0.2, 0.003);
        }
        grad(x, 0, 0, 0, 0.055, [
          [0, WW(0.12)],
          [0.5, KK(0)],
          [1, KK(0.25)],
        ]);
        grad(x, -0.2, 0, 0.2, 0, [
          [0, KK(0.18)],
          [0.45, WW(0.05)],
          [1, KK(0.18)],
        ]);
      },
      0,
    );
    for (const m of [-1, 1]) {
      const cf = shape(
        [
          ["M", 0.038, 0.915],
          ["L", 0.165, 0.905],
          ["Q", 0.17, 0.906, 0.169, 0.916],
          ["L", 0.161, 0.988],
          ["Q", 0.159, 0.998, 0.149, 0.998],
          ["L", 0.056, 1.003],
          ["Q", 0.046, 1.003, 0.045, 0.993],
        ],
        m,
      );
      part(
        g,
        cf,
        PB,
        (x) => {
          ribs(x, -0.18, 0.18, 0.9, 1.01, 0.0055, 0.15);
          grad(x, 0, 0.905, 0, 1.0, [
            [0, KK(0.32)],
            [0.15, KK(0)],
            [1, KK(0.2)],
          ]);
          grad(x, m * 0.04, 0, m * 0.17, 0, [
            [0, KK(0.22)],
            [0.4, WW(0.06)],
            [1, KK(0.22)],
          ]);
          edgeAO(x, cf, 0.25, 0.012);
        },
        0.32,
        0.012,
      );
    }
    for (const m of [-1, 1]) cord(g, [m * 0.012, 0.03, m * 0.02, 0.08, m * 0.012, 0.13, m * 0.022, 0.175], 0.008);
    g.save();
    g.fillStyle = PB;
    g.beginPath();
    g.ellipse(0, 0.034, 0.014, 0.01, 0, 0, TAU);
    g.fill();
    g.restore();
    dk(g, [-0.01, 0.034, 0.01, 0.036], 0.003, 0.3, 0.004);
    finish(c, g);
    return { c };
  }
  function pJoggerSide() {
    const { c, g } = pc("joggerS");
    const leg = shape([
      ["M", -0.1, 0.05],
      ["L", 0.1, 0.05],
      ["C", 0.125, 0.2, 0.13, 0.35, 0.112, 0.5],
      ["C", 0.1, 0.7, 0.086, 0.85, 0.076, 0.915],
      ["L", -0.058, 0.925],
      ["C", -0.075, 0.8, -0.09, 0.6, -0.11, 0.4],
      ["C", -0.13, 0.25, -0.125, 0.1, -0.1, 0.05],
    ]);
    part(
      g,
      leg,
      PB,
      (x) => {
        grad(x, -0.13, 0, 0.13, 0, [
          [0, KK(0.26)],
          [0.35, KK(0.02)],
          [0.66, WW(0.08)],
          [1, KK(0.22)],
        ]);
        edgeAO(x, leg, 0.3, 0.03);
        stitch(x, [0.0, 0.06, 0.005, 0.5, 0.008, 0.915], 0.16);
        sline(x, [0.04, 0.06, 0.09, 0.2], 0.006, KK(0.4), 0.006);
        crease(x, [-0.06, 0.55, 0.0, 0.58, 0.1, 0.53], 0.006, 0.14, 0.016);
        for (const [y, k] of [
          [0.79, 0.14],
          [0.83, 0.18],
          [0.86, 0.2],
          [0.89, 0.22],
        ])
          crease(x, [-0.06, y, 0.0, y + 0.014, 0.08, y - 0.006], 0.005, k, 0.008);
      },
      0.3,
      0.02,
    );
    const wb = shape([
      ["M", -0.1, 0],
      ["L", 0.1, 0],
      ["L", 0.102, 0.055],
      ["L", -0.102, 0.055],
    ]);
    part(
      g,
      wb,
      PB,
      (x) => {
        ribs(x, -0.11, 0.11, -0.01, 0.06, 0.0055, 0.12);
        grad(x, 0, 0, 0, 0.055, [
          [0, WW(0.12)],
          [1, KK(0.25)],
        ]);
        grad(x, -0.1, 0, 0.1, 0, [
          [0, KK(0.2)],
          [0.6, WW(0.05)],
          [1, KK(0.2)],
        ]);
      },
      0,
    );
    const cf = shape([
      ["M", -0.058, 0.915],
      ["L", 0.076, 0.905],
      ["L", 0.07, 0.998],
      ["L", -0.05, 1.003],
    ]);
    part(
      g,
      cf,
      PB,
      (x) => {
        ribs(x, -0.06, 0.08, 0.9, 1.01);
        grad(x, 0, 0.905, 0, 1, [
          [0, KK(0.3)],
          [0.2, KK(0)],
          [1, KK(0.2)],
        ]);
        grad(x, -0.06, 0, 0.08, 0, [
          [0, KK(0.2)],
          [0.6, WW(0.06)],
          [1, KK(0.2)],
        ]);
      },
      0.3,
      0.012,
    );
    cord(g, [0.1, 0.03, 0.112, 0.08, 0.104, 0.13, 0.114, 0.175], 0.008);
    finish(c, g);
    return { c };
  }
  /* ---- Gorra ---- */
  function pCap() {
    const { c, g } = pc("cap");
    const crown = sym([
      ["M", 0, 0.012],
      ["C", 0.075, 0.012, 0.118, 0.06, 0.12, 0.13],
      ["L", 0, 0.135],
    ]);
    part(
      g,
      crown,
      PB,
      (x) => {
        rgrad(x, -0.03, 0.05, 0.14, [
          [0, WW(0.16)],
          [0.6, KK(0.02)],
          [1, KK(0.3)],
        ]);
        edgeAO(x, crown, 0.3, 0.025);
        for (const m of [-1, 1]) {
          crease(x, [0, 0.014, m * 0.05, 0.03, m * 0.08, 0.13], 0.003, 0.3, 0.004);
          stitch(x, [m * 0.006, 0.02, m * 0.055, 0.04, m * 0.086, 0.13], 0.2);
          x.save();
          x.fillStyle = "#4a4a4a";
          x.beginPath();
          x.ellipse(m * 0.062, 0.058, 0.0042, 0.005, 0, 0, TAU);
          x.fill();
          x.fillStyle = WW(0.4);
          x.beginPath();
          x.ellipse(m * 0.062, 0.058, 0.0058, 0.0066, 0, 0, TAU);
          x.lineWidth = 0.0012;
          x.strokeStyle = WW(0.35);
          x.stroke();
          x.restore();
        }
        dk(x, [0, 0.02, 0, 0.13], 0.003, 0.3, 0.004);
      },
      0,
    );
    const vis = sym([
      ["M", 0, 0.118],
      ["Q", 0.09, 0.118, 0.128, 0.136],
      ["Q", 0.135, 0.16, 0.112, 0.178],
      ["Q", 0.062, 0.208, 0, 0.208],
    ]);
    part(
      g,
      vis,
      PB,
      (x) => {
        grad(x, 0, 0.118, 0, 0.208, [
          [0, KK(0.3)],
          [0.2, WW(0.1)],
          [0.75, KK(0)],
          [1, KK(0.22)],
        ]);
        edgeAO(x, vis, 0.28, 0.012);
        for (let i = 1; i <= 5; i++) {
          const t = i * 0.013;
          stitch(x, [-0.12 + t * 0.6, 0.14 + t * 0.15, 0, 0.124 + t * 1.05, 0.12 - t * 0.6, 0.14 + t * 0.15], 0.2, 0.004);
        }
      },
      0.4,
      0.014,
      0.01,
    );
    const btn = new Path2D();
    btn.ellipse(0, 0.012, 0.01, 0.006, 0, 0, TAU);
    part(
      g,
      btn,
      PB,
      (x) => {
        grad(x, 0, 0.006, 0, 0.018, [
          [0, WW(0.3)],
          [1, KK(0.3)],
        ]);
      },
      0.3,
      0.004,
      0.002,
    );
    finish(c, g);
    return { c };
  }
  const PAINTERS: Record<string, () => { c: HTMLCanvasElement }> = {
    hoodie: () => pLong({ key: "hoodie", hood: 1, pocket: 1 }),
    teeOv: () => pTee(TEE_OV),
    teeReg: () => pTee(TEE_REG),
    jogger: pJogger,
    cap: pCap,
    hoodieS: () => pLongSide({ key: "hoodieS", hood: 1 }),
    teeOvS: () => pTeeSide("teeOvS", 0.3, 0.74),
    teeRegS: () => pTeeSide("teeRegS", 0.25, 0.7),
    joggerS: pJoggerSide,
  };

  /* ===================== Prenda plana (billboard frente/perfil) ===================== */
  const PTEX = new Map<string, any>(),
    PGEO = new Map<string, THREE.PlaneGeometry>();
  function ptex(key: string) {
    if (PTEX.has(key)) return PTEX.get(key);
    const r = PAINTERS[key]();
    const mk = (cv: HTMLCanvasElement) => {
      const t = new T.CanvasTexture(cv);
      (t as any).encoding = (T as any).sRGBEncoding;
      t.anisotropy = 8;
      t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
      return t;
    };
    const o = { key, sp: PSPEC[key], c: (r as any).c, tex: mk((r as any).c) };
    PTEX.set(key, o);
    return o;
  }
  function pgeo(key: string) {
    if (!PGEO.has(key)) {
      const sp = PSPEC[key],
        h = sp.b - sp.t,
        gg = new T.PlaneGeometry(sp.w, h);
      gg.translate(0, -(sp.t + sp.b) / 2, 0);
      (gg as any).userData.shared = true;
      PGEO.set(key, gg);
    }
    return PGEO.get(key)!;
  }
  function tintLin(hex: string) {
    const c = new T.Color(hex);
    (["r", "g", "b"] as const).forEach((k) => {
      (c as any)[k] = (0.03 + 0.92 * (c as any)[k]) * 1.05;
    });
    return c;
  }
  function pMesh(o: any, color: THREE.Color) {
    const m = new T.MeshStandardMaterial({ map: o.tex, roughness: 0.95, metalness: 0, transparent: true, alphaTest: 0.3, side: T.DoubleSide });
    m.color.copy(color);
    const p = M(pgeo(o.key), m);
    p.castShadow = true;
    p.receiveShadow = true;
    return p;
  }
  function flatGarment(pid: string, color: string) {
    const p = (PROD as any)[pid],
      key = (PKEY as any)[pid],
      hex = colorInfo(color).hex,
      col = tintLin(hex),
      G = new T.Group(),
      fr = new T.Group(),
      sd = new T.Group();
    G.add(fr);
    G.add(sd);
    const F = ptex(key);
    fr.add(pMesh(F, col));
    const pa = (PRINT_AT as any)[pid];
    if (pa) {
      const pm = printMat(pa.kind, hex, pa.a, pa.label).clone();
      (pm as any).side = T.FrontSide;
      const pl = M(new T.PlaneGeometry(pa.w, pa.w * pa.a), pm);
      pl.position.set(0, -pa.y, 0.003);
      fr.add(pl);
    }
    const sk = PSPEC[key + "S"] ? key + "S" : null;
    if (sk) {
      const S = ptex(sk);
      sd.add(pMesh(S, col));
    } else {
      const s = pMesh(F, col);
      s.scale.x = 0.6;
      sd.add(s);
    }
    sd.rotation.y = -PI / 2;
    const fm: THREE.Mesh[] = [],
      sm2: THREE.Mesh[] = [];
    fr.traverse((o) => {
      if ((o as any).isMesh) fm.push(o as THREE.Mesh);
    });
    sd.traverse((o) => {
      if ((o as any).isMesh) sm2.push(o as THREE.Mesh);
    });
    let last = -1;
    (G as any).userData.fade = (ry: number) => {
      const a = Math.min(Math.abs(ry), PI - Math.abs(ry)),
        ws = sstep(0.5, 1.0, a),
        wf = 1 - ws;
      if (Math.abs(wf - last) < 0.002) return;
      last = wf;
      for (const o of fm) {
        (o.material as THREE.MeshStandardMaterial).opacity = wf;
        o.visible = wf > 0.02;
        o.castShadow = wf >= 0.5;
      }
      for (const o of sm2) {
        (o.material as THREE.MeshStandardMaterial).opacity = ws;
        o.visible = ws > 0.02;
        o.castShadow = ws > 0.5;
      }
    };
    (G as any).userData.fade(0);
    (G as any).userData.spec = F.sp;
    return G;
  }
  function flatThumb(pid: string, color: string) {
    const p = (PROD as any)[pid],
      F = ptex((PKEY as any)[pid]),
      hex = colorInfo(color).hex,
      N = 360,
      c = mkCanvas(N, N),
      g = c.getContext("2d")!,
      src = F.c;
    const s = Math.min((N * 0.9) / src.width, (N * 0.9) / src.height),
      w = src.width * s,
      h = src.height * s,
      x = (N - w) / 2,
      y = (N - h) / 2;
    const t = mkCanvas(src.width, src.height),
      tg = t.getContext("2d")!;
    tg.drawImage(src, 0, 0);
    tg.globalCompositeOperation = "multiply";
    const lin = tintLin(hex).clone();
    (["r", "g", "b"] as const).forEach((k) => {
      (lin as any)[k] = Math.min(1, (lin as any)[k]);
    });
    tg.fillStyle = "#" + lin.getHexString();
    tg.fillRect(0, 0, t.width, t.height);
    tg.globalCompositeOperation = "destination-in";
    tg.drawImage(src, 0, 0);
    g.drawImage(t, x, y, w, h);
    const pa = (PRINT_AT as any)[pid];
    if (pa) {
      const { ink, acc } = printInk(hex),
        im = (printTex(pa.kind, ink, acc, pa.a, pa.label) as any).image,
        k = s * PXM,
        cx = x + (F.sp.w / 2) * k,
        cy = y + (pa.y - F.sp.t) * k;
      g.globalAlpha = 0.94;
      g.drawImage(im, cx - (pa.w * k) / 2, cy - ((pa.w * pa.a * k) / 2), pa.w * k, pa.w * pa.a * k);
      g.globalAlpha = 1;
    }
    return c.toDataURL("image/png");
  }
  const thumbCache = new Map<string, string>();
  const thumbQueue: any[] = [];
  let thumbBusy = false;
  function thumb(pid: string, color: string) {
    const k = pid + "|" + color;
    if (thumbCache.has(k)) return Promise.resolve(thumbCache.get(k)!);
    return new Promise<string>((res) => {
      thumbQueue.push({ pid, color, res });
      runThumbs();
    });
  }
  async function runThumbs() {
    if (thumbBusy) return;
    thumbBusy = true;
    while (thumbQueue.length) {
      const { pid, color, res } = thumbQueue.shift();
      const k = pid + "|" + color;
      if (!thumbCache.has(k)) thumbCache.set(k, flatThumb(pid, color));
      const url = thumbCache.get(k)!;
      $$(`img[data-thumb="${k}"]`).forEach((im: any) => (im.src = url));
      res(url);
      await new Promise((r) => setTimeout(r, 0));
    }
    thumbBusy = false;
  }
  function wantThumbs(r: ParentNode = root) {
    $$("img[data-thumb]", r).forEach((im: any) => {
      if (!im.getAttribute("src")) {
        const [p, c] = im.dataset.thumb.split("|");
        thumb(p, c);
      }
    });
  }

  /* ===================== El riel ===================== */
  function shadowTex() {
    const c = mkCanvas(128, 128),
      g = c.getContext("2d")!;
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, "rgba(0,0,0,.45)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    return texFrom(c);
  }
  let SHADOW: THREE.Texture;
  function pegboardTex() {
    const rp = 256,
      c = mkCanvas(rp, rp),
      g = c.getContext("2d")!;
    g.fillStyle = "#EDEBE6";
    g.fillRect(0, 0, rp, rp);
    for (let k = 0; k < 2600; k++) {
      const v = (225 + rnd() * 25) | 0;
      g.fillStyle = `rgba(${v},${v - 2},${v - 6},.35)`;
      g.fillRect(rnd() * rp, rnd() * rp, 1.5, 1.5);
    }
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) {
        const cx = 32 + x * 64,
          cy = 32 + y * 64;
        const gr = g.createRadialGradient(cx - 0.6, cy - 0.8, 0.4, cx, cy, 4.2);
        gr.addColorStop(0, "rgba(60,55,48,.55)");
        gr.addColorStop(0.7, "rgba(90,84,74,.35)");
        gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr;
        g.beginPath();
        g.arc(cx, cy, 4.2, 0, TAU);
        g.fill();
      }
    return texFrom(c, { srgb: true });
  }
  function wallText(draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number, hM: number) {
    const c = mkCanvas(w, h),
      g = c.getContext("2d")!;
    draw(g, w, h);
    const t = texFrom(c, { srgb: true });
    t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
    const m = M(new T.PlaneGeometry((hM * w) / h, hM), new T.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.92, depthWrite: false }));
    (m as any).receiveShadow = true;
    return m;
  }
  function sectionTitle(text: string, sub?: string) {
    const fs = 150;
    const c0 = mkCanvas(8, 8).getContext("2d")!;
    c0.font = `800 ${fs}px ${DISPLAY}`;
    const tw = Math.ceil(c0.measureText(text).width) + 40;
    const p = wallText(
      (g, w, h) => {
        g.textBaseline = "alphabetic";
        g.fillStyle = "#1B1A18";
        g.font = `800 ${fs}px ${DISPLAY}`;
        g.fillText(text, 10, fs * 1.02);
        if (sub) {
          g.fillStyle = "#6A645A";
          g.font = `600 ${fs * 0.22}px ${MONO}`;
          g.fillText(sub.toUpperCase(), 14, fs * 1.42);
        }
      },
      tw,
      Math.round(fs * 1.6),
      0.22,
    );
    (p as any).userData.w = (p.geometry as THREE.PlaneGeometry).parameters.width;
    return p;
  }
  function woodHanger() {
    const G = new T.Group();
    G.add(
      M(
        tube(
          [
            [-0.215, -0.065, 0],
            [-0.12, -0.03, 0],
            [0, -0.006, 0],
            [0.12, -0.03, 0],
            [0.215, -0.065, 0],
          ],
          0.011,
          30,
          10,
        ),
        WOODM,
      ),
    );
    G.add(
      M(
        tube(
          [
            [0, -0.006, 0],
            [0, 0.04, 0],
            [0, 0.068, 0.004],
            [0, 0.084, 0.022],
            [0, 0.074, 0.04],
            [0, 0.06, 0.042],
          ],
          0.003,
          24,
          6,
        ),
        METAL,
      ),
    );
    return G;
  }
  function woodClip() {
    const G = new T.Group();
    G.add(M(new T.BoxGeometry(0.38, 0.03, 0.016), WOODM));
    for (const rp of [-1, 1]) {
      const cl = M(new T.BoxGeometry(0.028, 0.038, 0.022), METAL);
      cl.position.set(rp * 0.16, -0.024, 0);
      G.add(cl);
    }
    G.add(
      M(
        tube(
          [
            [0, 0.015, 0],
            [0, 0.046, 0],
            [0, 0.072, 0.004],
            [0, 0.088, 0.022],
            [0, 0.078, 0.04],
            [0, 0.064, 0.042],
          ],
          0.003,
          24,
          6,
        ),
        METAL,
      ),
    );
    return G;
  }
  function shadowsOn(o: THREE.Object3D) {
    o.traverse((c) => {
      if ((c as any).isMesh) (c as any).castShadow = true;
    });
  }

  const byLight = (cols: string[]) => cols.slice().sort((a, b) => hexLum(colorInfo(b).hex) - hexLum(colorInfo(a).hex));
  const RAIL_Y = 1.8,
    RAIL_Z = 0.34,
    FRAME_LO = 0.62,
    FRAME_HI = 2.36,
    SEC_GAP = 0.75,
    SPREAD = 0.36,
    FRONT = -0.2;
  const W_OF: Record<string, number> = { arriba: 0.3, abajo: 0.27, accesorio: 0.25 };
  let heroObj: THREE.Mesh | null = null;
  let rail: any[] = [],
    railGroup: THREE.Group,
    keyLight: THREE.DirectionalLight,
    railBar: THREE.Mesh | null = null;
  let secSigns: THREE.Object3D[] = [];
  function hangItem(pid: string, color: string) {
    const p = (PROD as any)[pid],
      P = new T.Group(),
      g = flatGarment(pid, color),
      sp = (g as any).userData.spec;
    let h: THREE.Group, bottom: number;
    if (p.cat === "arriba") {
      h = woodHanger();
      const ny = p.type === "hoodie" ? -0.11 : -0.06;
      h.position.y = p.type === "hoodie" ? -0.122 : -0.1;
      g.position.set(0, ny, 0.014);
      bottom = ny - sp.b;
    } else {
      h = woodClip();
      if (p.cat !== "abajo") h.scale.set(0.62, 1, 1);
      h.position.y = -0.1;
      g.position.set(0, -0.112, -0.012);
      bottom = -0.112 - sp.b;
    }
    shadowsOn(h);
    P.add(h);
    P.add(g);
    (P as any).userData.bottom = bottom;
    (P as any).userData.fade = (g as any).userData.fade;
    return P;
  }
  function slot(kind: string, sec: string, o: any = {}) {
    return Object.assign({ kind, sec, w: 0.3, bottom: -0.8 }, o);
  }
  function buildRail() {
    SHADOW = shadowTex();
    scene.background = new T.Color("#E7E5E0");
    scene.fog = null as any;
    scene.add(new T.HemisphereLight("#FFFDF8", "#9A9388", 0.42));
    keyLight = new T.DirectionalLight("#FFF4E6", 1.55);
    keyLight.castShadow = true;
    const ms = isPhone() ? 1024 : 2048;
    keyLight.shadow.mapSize.set(ms, ms);
    (keyLight.shadow as any).radius = 9;
    (keyLight.shadow as any).blurSamples = 14;
    keyLight.shadow.bias = -0.0006;
    (keyLight.shadow as any).normalBias = 0.015;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 12;
    scene.add(keyLight);
    scene.add(keyLight.target);
    const fill = new T.DirectionalLight("#E9EEF5", 0.22);
    fill.position.set(3, 2, 6);
    scene.add(fill);
    const pm = new T.PMREMGenerator(renderer);
    const env = new T.Scene();
    env.background = new T.Color("#77736c");
    const lp = M(new T.PlaneGeometry(10, 4), new T.MeshBasicMaterial({ color: "#ffffff", side: T.DoubleSide }));
    lp.position.set(0, 4, 6);
    lp.lookAt(0, 0, 0);
    env.add(lp);
    scene.environment = pm.fromScene(env, 0.04).texture;
    pm.dispose();
    const peg = pegboardTex();
    const tile = 0.2;
    peg.repeat.set(400 / tile, 6 / tile);
    const wall = M(new T.PlaneGeometry(400, 6), new T.MeshStandardMaterial({ map: peg, roughness: 0.88 }));
    wall.position.set(150, 2.2, 0);
    (wall as any).receiveShadow = true;
    scene.add(wall);
    railGroup = new T.Group();
    scene.add(railGroup);

    rail = [slot("intro", "tienda", { w: 0.5 })];
    for (const S of SECS) {
      if (!S.items) {
        if (S.id === "look") rail.push(slot("look", "look", { w: 1.7 }));
        continue;
      }
      for (const [pid, cols] of S.items) for (const c of byLight(cols)) rail.push(slot("g", S.id, { pid, color: c, w: W_OF[(PROD as any)[pid].cat] }));
    }
    rail.push(slot("end", "pedido", { w: 0.55 }));
    rail.forEach(makeSlotObj);
    const hero = wallText(
      (g, w, h) => {
        g.textAlign = "center";
        g.fillStyle = "#111111";
        g.font = `800 ${h * 0.46}px ${DISPLAY}`;
        g.fillText(ROPERO_CFG.brand, w / 2, h * 0.46);
        g.fillStyle = "#6A645A";
        g.font = `600 ${h * 0.075}px ${MONO}`;
        g.fillText(ROPERO_CFG.sub, w / 2, h * 0.68);
        g.fillStyle = "#A3412A";
        g.font = `600 ${h * 0.09}px ${MONO}`;
        g.fillText(ROPERO_CFG.tagline, w / 2, h * 0.84);
      },
      1400,
      520,
      0.6,
    );
    hero.position.set(-0.2, 2.02, 0.002);
    railGroup.add(hero);
    heroObj = hero;
    rail[0].bottom = -0.62;
    layoutRail();
  }
  function makeSlotObj(it: any) {
    if (it.kind === "g") {
      it.obj = hangItem(it.pid, it.color);
      it.bottom = (it.obj as any).userData.bottom;
    } else if (it.kind === "look") {
      it.obj = new T.Group();
      const comp = new T.Group();
      it.obj.add(comp);
      it.mann = comp;
      const a = hangItem(LOOK[0][0], LOOK[0][1]),
        b = hangItem(LOOK[1][0], LOOK[1][1]);
      a.position.x = -0.36;
      b.position.x = 0.42;
      comp.add(a);
      comp.add(b);
      it.bottom = Math.min((a as any).userData.bottom, (b as any).userData.bottom);
    } else if (it.kind === "end") {
      const h = woodHanger();
      h.position.y = -0.1;
      it.obj = new T.Group();
      it.obj.add(h);
      shadowsOn(it.obj);
      it.bottom = -0.35;
    } else it.obj = it.obj || new T.Group();
    it.obj.userData.slot = it;
    railGroup.add(it.obj);
  }
  function layoutRail() {
    let x = 0;
    rail.forEach((it, i) => {
      if (i > 0) {
        const pr = rail[i - 1];
        x += (pr.w + it.w) / 2 + (pr.sec !== it.sec ? SEC_GAP : 0);
      }
      it.bx = x;
    });
    const end = rail[rail.length - 1].bx + 1.2,
      start = rail[0].bx + 0.4;
    if (railBar) {
      railGroup.remove(railBar);
      railBar.geometry.dispose();
    }
    railBar = M(new T.CylinderGeometry(0.013, 0.013, end - start, 14), plainMat("#C9C6BF", { metalness: 0.9, roughness: 0.25 }));
    railBar.rotation.z = PI / 2;
    railBar.position.set((start + end) / 2, RAIL_Y, RAIL_Z);
    (railBar as any).castShadow = true;
    railGroup.add(railBar);
    for (const rp of secSigns) railGroup.remove(rp);
    secSigns = [];
    for (let x = start + 0.3; x < end; x += 2.6) {
      const b = M(new T.BoxGeometry(0.03, 0.05, RAIL_Z), plainMat("#BDB9B1", { metalness: 0.8, roughness: 0.3 }));
      b.position.set(x, RAIL_Y, RAIL_Z / 2);
      (b as any).castShadow = true;
      railGroup.add(b);
      secSigns.push(b);
    }
    SECS.forEach((S, si) => {
      if (si === 0) return;
      const i = rail.findIndex((r) => r.sec === S.id);
      if (i < 0) return;
      const it = rail[i];
      if (!(S as any).sign) (S as any).sign = sectionTitle(S.title, S.sub);
      const p = (S as any).sign;
      p.position.set(it.bx - it.w / 2 - 0.05 + (p as any).userData.w / 2, RAIL_Y + 0.42, 0.002);
      railGroup.add(p);
      secSigns.push(p);
      (S as any).start = i;
    });
    (SECS[0] as any).start = 0;
  }

  /* ===================== Movimiento ===================== */
  let rp = 0,
    sT = 0,
    vel = 0,
    dirty = true,
    settleAt = 0,
    lastFocus = -1,
    dragging = false;
  const invalidate = () => {
    dirty = true;
  };
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const sm = (t: number) => {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  };
  function camXAt(v: number) {
    const n = rail.length - 1;
    v = clamp(v, 0, n);
    const a = Math.floor(v),
      b = Math.min(n, a + 1),
      f = v - a;
    return lerp(rail[a].bx, rail[b].bx, f);
  }
  let camD = 4,
    camVisW = 4,
    freeR = { top: 80, bottom: 600, left: 0, right: 400 };
  function placeRail(now: number) {
    const X = camXAt(rp),
      fi = Math.round(clamp(rp, 0, rail.length - 1));
    const sway = reduced ? 0 : 0.055 * Math.sin((now / 1000) * 1.05) * sm((now - settleAt) / 900) * (1 - sm((now - settleAt - 4500) / 1500));
    rail.forEach((it, i) => {
      const d = i - rp,
        ad = Math.min(1, Math.abs(d)),
        f = 1 - sm(ad),
        sg = Math.sign(d) || 0;
      const x = it.bx + sg * SPREAD * sm(ad) * (it.kind === "look" || rail[fi].kind === "look" ? 0.6 : 1);
      it.obj.position.set(x, RAIL_Y, RAIL_Z);
      if (it.kind === "g" || it.kind === "end") {
        const ry = -sg * 1.38 * (1 - f) + f * (FRONT + (i === fi ? sway : 0));
        it.obj.rotation.y = ry;
        it.obj.userData.fade && it.obj.userData.fade(ry);
      } else if (it.kind === "look") {
        it.mann.rotation.y = -0.35 * sg * (1 - f) + f * (-0.25 + (i === fi ? sway * 1.4 : 0));
      }
    });
    cam.position.set(X, (FRAME_LO + FRAME_HI) / 2, RAIL_Z + camD);
    cam.lookAt(X, (FRAME_LO + FRAME_HI) / 2, RAIL_Z);
    keyLight.position.set(X - 1.6, 4.4, 4.6);
    keyLight.target.position.set(X + 0.3, 1.3, 0);
    keyLight.target.updateMatrixWorld();
    const sc = keyLight.shadow.camera as THREE.OrthographicCamera,
      hw = camVisW / 2 + 1.6;
    if (sc.right !== hw) {
      sc.left = -hw;
      sc.right = hw;
      sc.top = 2.2;
      sc.bottom = -2.2;
      sc.updateProjectionMatrix();
    }
  }
  function applyOffset(c: THREE.PerspectiveCamera, fr: typeof freeR) {
    const W = vw(),
      H = vh();
    c.aspect = W / H;
    c.setViewOffset(W, H, W / 2 - (fr.left + fr.right) / 2, H / 2 - (fr.top + fr.bottom) / 2, W, H);
    c.updateProjectionMatrix();
  }
  function frameCam() {
    const W = vw(),
      H = vh(),
      top = $("#top").getBoundingClientRect().bottom - root.getBoundingClientRect().top,
      dock = $("#dock").getBoundingClientRect().top - root.getBoundingClientRect().top;
    freeR = { top: top + 4, bottom: dock - (H < 500 ? 30 : 44), left: 0, right: W };
    const fh = Math.max(140, freeR.bottom - freeR.top);
    cam.fov = W < H ? 32 : H < 500 ? 30 : 24;
    const tf = Math.tan((cam.fov * PI) / 360);
    camD = ((FRAME_HI - FRAME_LO) * H) / fh / (2 * tf);
    camVisW = (W / H) * 2 * camD * tf;
    const minW = W < H ? 1.4 : 0;
    if (camVisW < minW) {
      camD *= minW / camVisW;
      camVisW = minW;
    }
    if (heroObj) {
      const hw = (heroObj.geometry as THREE.PlaneGeometry).parameters.width;
      heroObj.position.x = camVisW > 2.6 ? -Math.min(camVisW / 2 - hw / 2 - 0.15, 1.1) : 0;
      heroObj.scale.setScalar(Math.min(1, (camVisW * 0.9) / hw));
    }
    applyOffset(cam, freeR);
    invalidate();
  }
  function goTo(i: number, instant?: boolean) {
    i = clamp(Math.round(i), 0, rail.length - 1);
    sT = i;
    if (instant || reduced) {
      rp = i;
      vel = 0;
    }
    wake();
  }
  function step(d: number) {
    if (d > 0 && !LS.get("fk_adv", false)) {
      LS.set("fk_adv", true);
      $("#next").classList.remove("pulse");
    }
    hideGuide();
    goTo(Math.round(sT) + d);
  }
  function goSection(id: string) {
    const S: any = SECS.find((x) => x.id === id);
    if (S && S.start != null) goTo(S.start);
  }
  function wake() {
    invalidate();
  }

  function frameLoop(now: number) {
    if (destroyed) return;
    raf(frameLoop);
    if (!dragging) {
      const k = reduced ? 1 : 0.14;
      const prev = rp;
      rp += (sT - rp) * k + vel;
      vel *= 0.86;
      if (Math.abs(vel) < 0.0004) vel = 0;
      if (Math.abs(sT - rp) < 0.0008 && !vel) rp = sT;
      if (rp !== prev) {
        dirty = true;
        settleAt = now;
      }
    }
    const swaying = !reduced && now - settleAt < 6200 && Math.abs(sT - rp) < 0.001;
    if (swaying) dirty = true;
    if (!dirty) return;
    dirty = false;
    placeRail(now);
    renderer.render(scene, cam);
    updateFocus();
  }

  /* ===================== Etiqueta de la prenda enfocada ===================== */
  const label = $("#focusLabel"),
    live = $("#focusLive");
  const _p = new T.Vector3();
  function cartHasItems() {
    return useCartStore.getState().lines.length > 0;
  }
  function focusText(it: any) {
    if (it.kind === "g") return { t: (PROD as any)[it.pid].name, sub: colorInfo(it.color).name };
    if (it.kind === "intro") return { t: "Indumentaria técnica de paracaidismo, hecha para moverse", sub: "Desliza para recorrer el riel" };
    if (it.kind === "look") return { t: "Completa el look", sub: LOOK.map(([p]) => (PROD as any)[p].short).join(" + ") };
    return {
      t: cartHasItems() ? "Tu pedido está listo" : "Explora el catálogo completo",
      sub: cartHasItems() ? `${cartCount(useCartStore.getState().lines)} prenda(s) en el carrito` : "Toca cualquier prenda para elegir talla y color",
    };
  }
  function focusActs(it: any) {
    if (it.kind === "g") return `<button type="button" class="fl-btn" data-act="open">Ver prenda</button>`;
    if (it.kind === "look") return `<button type="button" class="fl-btn" data-act="look">Ver el look</button>`;
    if (it.kind === "end") return `<button type="button" class="fl-btn" data-act="cart">${cartHasItems() ? "Revisar pedido" : "Ver catálogo"}</button>`;
    return `<button type="button" class="fl-btn" data-act="next">Empezar</button>`;
  }
  function updateFocus() {
    const fi = clamp(Math.round(rp), 0, rail.length - 1),
      it = rail[fi],
      near = Math.abs(rp - fi) < 0.22;
    if (fi !== lastFocus) {
      lastFocus = fi;
      const ft = focusText(it);
      label.innerHTML = `<b>${esc(ft.t)}</b><span>${esc(ft.sub)}</span>${focusActs(it)}`;
      live.textContent = ft.t + ". " + ft.sub;
      (label as any).dataset.i = String(fi);
      setActiveSec(it.sec);
    }
    _p.set(it.obj.position.x, RAIL_Y + it.bottom - 0.1, RAIL_Z);
    _p.project(cam);
    const rootTop = root.getBoundingClientRect().top;
    const dockTop = $("#dock").getBoundingClientRect().top - rootTop,
      y = Math.min(((1 - _p.y) / 2) * vh(), dockTop - (label.offsetHeight || 64) - 8),
      x = clamp(((_p.x + 1) / 2) * vw(), 120, vw() - 120);
    label.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0) translateX(-50%)`;
    label.classList.toggle("on", near && !dragging);
    ($("#prev") as HTMLButtonElement).disabled = fi === 0;
    ($("#next") as HTMLButtonElement).disabled = fi === rail.length - 1;
    $("#progFill").style.width = (fi / (rail.length - 1)) * 100 + "%";
  }
  on(label, "click", (e: MouseEvent) => {
    const b = (e.target as HTMLElement).closest("[data-act]") as HTMLElement;
    const it = rail[+(label as any).dataset.i];
    if (!it) return;
    const a = b ? b.dataset.act : "open";
    activate(it, a);
  });
  function activate(it: any, a?: string) {
    if (it.kind === "g") openProduct(it.pid, it.color);
    else if (it.kind === "look" || a === "look") {
      OF.st = Object.assign(OF.st, { top: LOOK[0][0], topC: LOOK[0][1], bot: LOOK[1][0], botC: LOOK[1][1] });
      openOutfit();
    } else if (it.kind === "end") {
      if (cartHasItems()) useCartStore.getState().open();
      else openCatalog();
    } else step(1);
  }

  /* ===================== Menú de secciones ===================== */
  const secNav = $("#sections");
  secNav.innerHTML =
    SECS.map((S) => `<button type="button" data-sec="${S.id}">${esc(S.name)}</button>`).join("") +
    `<span class="sep" aria-hidden="true"></span><button type="button" class="info" data-act="info" aria-label="Envíos, cambios y pagos">i</button>`;
  on(secNav, "click", (e: MouseEvent) => {
    const b = (e.target as HTMLElement).closest("button") as HTMLButtonElement;
    if (!b) return;
    if (b.dataset.act === "info") {
      openDlg("#dlgInfo");
      return;
    }
    hideGuide();
    goSection(b.dataset.sec!);
  });
  let activeSec: string | null = null;
  function setActiveSec(id: string) {
    if (id === activeSec) return;
    activeSec = id;
    $$("#sections button[data-sec]").forEach((b: any) => {
      const onSec = b.dataset.sec === id;
      b.setAttribute("aria-current", onSec ? "true" : "false");
      if (onSec) b.scrollIntoView({ inline: "center", block: "nearest", behavior: reduced ? "auto" : "smooth" });
    });
  }
  on($("#prev"), "click", () => step(-1));
  on($("#next"), "click", () => step(1));
  if (!LS.get("fk_adv", false)) $("#next").classList.add("pulse");
  const guide = $("#guide");
  let guideOn = !LS.get("fk_guide", false);
  function placeGuide() {
    if (!guideOn) return;
    guide.hidden = false;
  }
  function hideGuide() {
    if (!guideOn) return;
    guideOn = false;
    guide.hidden = true;
    LS.set("fk_guide", true);
  }

  /* ===================== Gestos ===================== */
  const canvas = $("#store") as HTMLCanvasElement;
  const ray = new T.Raycaster();
  let pd: any = null;
  const pxPerItem = () => {
    const it = rail[clamp(Math.round(rp), 0, rail.length - 1)];
    const nb = rail[Math.min(rail.length - 1, Math.round(rp) + 1)];
    const dw = Math.max(0.25, Math.abs(nb.bx - it.bx) || 0.3);
    return (dw / camVisW) * vw();
  };
  on(canvas, "pointerdown", (e: PointerEvent) => {
    hideGuide();
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    pd = { x: e.clientX, y: e.clientY, t: performance.now(), lx: e.clientX, ly: e.clientY, lt: performance.now(), axis: null, moved: false, v: 0 };
    vel = 0;
  });
  on(canvas, "pointermove", (e: PointerEvent) => {
    if (!pd) return;
    const dx = e.clientX - pd.lx,
      dy = e.clientY - pd.ly,
      now = performance.now();
    if (!pd.axis) {
      const tx = e.clientX - pd.x,
        ty = e.clientY - pd.y;
      if (Math.hypot(tx, ty) > 8) pd.axis = Math.abs(tx) >= Math.abs(ty) ? "x" : "y";
      else return;
    }
    dragging = true;
    pd.moved = true;
    const d = (pd.axis === "x" ? dx : dy) / pxPerItem();
    const prev = rp;
    rp = clamp(rp - d, -0.35, rail.length - 0.65);
    sT = rp;
    const dt = Math.max(1, now - pd.lt);
    pd.v = lerp(pd.v, ((rp - prev) / dt) * 16, 0.4);
    pd.lx = e.clientX;
    pd.ly = e.clientY;
    pd.lt = now;
    dirty = true;
    settleAt = now;
    canvas.style.cursor = "grabbing";
  });
  function endDrag(e: PointerEvent, cancel?: boolean) {
    if (!pd) return;
    const P = pd;
    pd = null;
    canvas.style.cursor = "";
    if (!P.moved) {
      dragging = false;
      if (!cancel && performance.now() - P.t < 500) pick(e.clientX, e.clientY);
      return;
    }
    dragging = false;
    const proj = rp + clamp(P.v * 5, -4, 4);
    sT = clamp(Math.round(proj), 0, rail.length - 1);
    vel = 0;
    if (!LS.get("fk_adv", false) && sT > 0) {
      LS.set("fk_adv", true);
      $("#next").classList.remove("pulse");
    }
    wake();
  }
  on(canvas, "pointerup", (e: PointerEvent) => endDrag(e));
  on(canvas, "pointercancel", (e: PointerEvent) => endDrag(e, true));
  let wheelT: any = null;
  on(
    root,
    "wheel",
    (e: WheelEvent) => {
      if ($("dialog[open]")) return;
      if ((e.target as HTMLElement).closest("#top,#dock")) return;
      e.preventDefault();
      hideGuide();
      const d = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * (e.deltaMode === 1 ? 32 : 1);
      sT = clamp(sT + (d / pxPerItem()) * 0.9, 0, rail.length - 1);
      rp = lerp(rp, sT, 0.35);
      dirty = true;
      settleAt = performance.now();
      clearTimeout(wheelT);
      wheelT = setTimeout(() => {
        sT = clamp(Math.round(sT), 0, rail.length - 1);
        wake();
      }, 140);
    },
    { passive: false },
  );
  let hovering = false;
  on(root, "pointerenter", () => (hovering = true));
  on(root, "pointerleave", () => (hovering = false));
  on(window, "keydown", (e: KeyboardEvent) => {
    if (!hovering && !$("dialog[open]")) return;
    if ((e.target as HTMLElement).matches?.("input,textarea,select")) return;
    if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) {
      e.preventDefault();
      step(1);
    } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
      e.preventDefault();
      step(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(rail.length - 1);
    }
  });
  function pick(x: number, y: number) {
    const rb = root.getBoundingClientRect();
    ray.setFromCamera({ x: ((x - rb.left) / vw()) * 2 - 1, y: -((y - rb.top) / vh()) * 2 + 1 } as any, cam);
    const hits = ray.intersectObjects(railGroup.children, true);
    for (const h of hits.slice(0, 6)) {
      let o: any = h.object;
      while (o && !o.userData.slot) o = o.parent;
      if (o) {
        const i = rail.indexOf(o.userData.slot);
        if (i < 0) continue;
        if (i === Math.round(rp)) activate(rail[i], "open");
        else {
          hideGuide();
          goTo(i);
        }
        return;
      }
    }
  }

  /* ===================== Estudio 3D (ficha y outfit) ===================== */
  let studio: any = null;
  function getStudio() {
    if (studio) return studio;
    const r = new T.WebGLRenderer({ antialias: true, alpha: true });
    (r as any).outputEncoding = (T as any).sRGBEncoding;
    r.toneMapping = T.ACESFilmicToneMapping;
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    const pm = new T.PMREMGenerator(r);
    const env = new T.Scene();
    env.background = new T.Color("#bdb8ae");
    const lp = M(new T.PlaneGeometry(4, 4), new T.MeshBasicMaterial({ color: "#fff", side: T.DoubleSide }));
    lp.position.set(1, 3, 2);
    lp.lookAt(0, 0, 0);
    env.add(lp);
    const envTex = pm.fromScene(env, 0.04).texture;
    pm.dispose();
    const mkScene = () => {
      const s = new T.Scene();
      s.environment = envTex;
      s.add(new T.HemisphereLight("#FFFFFF", "#7A746A", 0.55));
      const k = new T.DirectionalLight("#FFF4E4", 1.05);
      k.position.set(2, 4, 3);
      s.add(k);
      const rl = new T.DirectionalLight("#DCE6F5", 0.3);
      rl.position.set(-3, 2, -2);
      s.add(rl);
      return s;
    };
    studio = { r, canvas: r.domElement, mkScene, mode: null, host: null, needs: false, loop: false };
    return studio;
  }
  function attachStudio(hostSel: string, mode: "viewer" | "outfit") {
    const S = getStudio();
    const host = $(hostSel);
    host.insertBefore(S.canvas, host.querySelector(".stage-btns"));
    S.host = host;
    S.mode = mode;
    S.needs = true;
    resizeStudio();
    if (!S.loop) {
      S.loop = true;
      raf(studioLoop);
    }
  }
  function detachStudio() {
    if (!studio) return;
    studio.mode = null;
    studio.loop = false;
    if (studio.canvas.parentNode) studio.canvas.parentNode.removeChild(studio.canvas);
  }
  function resizeStudio() {
    const S = studio;
    if (!S || !S.host) return;
    const r = S.host.getBoundingClientRect();
    if (r.width < 10) return;
    S.r.setPixelRatio(Math.min(devicePixelRatio, 2));
    S.r.setSize(r.width, r.height, false);
    const c = S.mode === "viewer" ? V.cam : OF.cam;
    if (c) {
      c.aspect = r.width / r.height;
      c.updateProjectionMatrix();
    }
    if (S.mode === "viewer" && V.model) {
      const d = vFit(),
        z = V.dist / V.dist0;
      V.dist0 = d;
      V.dist = d * z;
    }
    S.needs = true;
  }
  const pdStageObs = new ResizeObserver(() => resizeStudio());
  pdStageObs.observe($("#pdStage"));
  const ofStageObs = new ResizeObserver(() => resizeStudio());
  ofStageObs.observe($("#ofStage"));
  cleanups.push(() => {
    pdStageObs.disconnect();
    ofStageObs.disconnect();
  });
  const ptrs = new Map<number, any>();
  let lastTap = 0,
    pinch0: any = null;
  function studioDown(e: PointerEvent) {
    const S = studio;
    if (!S || !S.mode) return;
    (S.canvas as HTMLCanvasElement).setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: V.dist, scale: OF.off.s };
    }
    handler().down && handler().down();
  }
  function studioMove(e: PointerEvent) {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x,
      dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (ptrs.size >= 2 && pinch0) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      handler().pinch && handler().pinch(d / pinch0.d, pinch0);
    } else handler().drag && handler().drag(dx, dy);
    studio.needs = true;
  }
  function studioUp(e: PointerEvent) {
    const p = ptrs.get(e.pointerId);
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch0 = null;
    if (!p) return;
    if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 8) {
      const now = performance.now();
      if (now - lastTap < 320) {
        handler().reset && handler().reset();
        lastTap = 0;
      } else lastTap = now;
    }
    handler().up && handler().up();
  }
  function handler() {
    return studio && studio.mode === "viewer" ? VH : OFH;
  }
  for (const sel of ["#pdStage", "#ofStage"]) {
    const h = $(sel);
    on(h, "pointerdown", (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      studioDown(e);
    });
    on(h, "pointermove", studioMove);
    on(h, "pointerup", studioUp);
    on(h, "pointercancel", studioUp);
    on(
      h,
      "wheel",
      (e: WheelEvent) => {
        e.preventDefault();
        handler().wheel && handler().wheel(e.deltaY);
        studio && (studio.needs = true);
      },
      { passive: false },
    );
    on(h, "dblclick", (e: MouseEvent) => {
      e.preventDefault();
      handler().reset && handler().reset();
    });
  }
  function studioLoop(now: number) {
    if (destroyed) return;
    const S = studio;
    if (!S || !S.loop) return;
    raf(studioLoop);
    if (S.mode === "viewer") VH.tick(now);
    else if (S.mode === "outfit") OFH.tick(now);
    if (S.needs) {
      S.needs = false;
      if (S.mode === "viewer") S.r.render(V.scene, V.cam);
      else if (S.mode === "outfit") S.r.render(OF.scene, OF.cam);
    }
  }

  /* ---- Visor de la ficha ---- */
  const V: any = { scene: null, cam: null, pivot: null, model: null, yaw: 0, dist: 2, dist0: 2, vel: 0, drag: false, lastUp: 0, reset: null };
  function vYaw() {
    if (!V.model) return;
    V.pivot.rotation.set(0, V.yaw, 0);
    V.model.userData.fade(V.yaw);
    if (studio) studio.needs = true;
  }
  const VH = {
    down() {
      V.drag = true;
      V.vel = 0;
      V.reset = null;
    },
    drag(dx: number) {
      V.yaw = clamp(V.yaw + dx * 0.004, -0.3, 0.3);
      V.vel = dx * 0.008;
      vYaw();
    },
    up() {
      V.drag = false;
      V.lastUp = performance.now();
    },
    pinch(r: number, p0: any) {
      V.dist = clamp(p0.dist / r, V.dist0 * 0.45, V.dist0 * 2.2);
      V.reset = null;
    },
    wheel(d: number) {
      V.dist = clamp(V.dist * (1 + d * 0.0012), V.dist0 * 0.45, V.dist0 * 2.2);
    },
    reset() {
      V.reset = { y: V.yaw, d: V.dist, t: performance.now() };
      V.vel = 0;
    },
    tick(now: number) {
      if (!V.pivot) return;
      if (V.reset) {
        const t = clamp((now - V.reset.t) / 550, 0, 1),
          e = ease(t);
        V.yaw = lerp(V.reset.y, 0, e);
        V.dist = lerp(V.reset.d, V.dist0, e);
        if (t >= 1) {
          V.reset = null;
          V.lastUp = now;
        }
        vYaw();
      } else if (!V.drag) {
        if (Math.abs(V.vel) > 0.0004) {
          V.yaw = clamp(V.yaw + V.vel, -1.45, 1.45);
          V.vel *= 0.92;
          vYaw();
        } else if (!reduced && now - V.lastUp > 1400) {
          const tg = 0.1 * Math.sin(now / 1800);
          if (Math.abs(tg - V.yaw) > 0.0005) {
            V.yaw += (tg - V.yaw) * 0.03;
            vYaw();
          }
        }
      }
      const want = V.dist;
      if (Math.abs(V.cam.position.z - want) > 0.0005) {
        V.cam.position.z = lerp(V.cam.position.z, want, 0.25);
        studio.needs = true;
      }
    },
  };
  function viewerModel(pid: string, color: string, size: string) {
    const S = getStudio();
    if (!V.scene) {
      V.scene = S.mkScene();
      V.cam = new T.PerspectiveCamera(32, 1, 0.01, 30);
      V.pivot = new T.Group();
      V.scene.add(V.pivot);
    }
    if (V.model) V.pivot.remove(V.model);
    const g = flatGarment(pid, color),
      s = SIZE_SCALE[size] || 1,
      sp = (g as any).userData.spec;
    g.scale.set(s, s * (1 + (s - 1) * 0.6), s);
    g.position.y = ((sp.t + sp.b) / 2) * g.scale.y;
    V.model = g;
    V.pivot.add(g);
    vYaw();
  }
  function vFit() {
    const sp = V.model.userData.spec,
      h = (sp.b - sp.t) * V.model.scale.y,
      w = sp.w * V.model.scale.x,
      tn = Math.tan((32 * PI) / 360),
      hr = $("#pdStage").getBoundingClientRect(),
      asp = hr.height > 10 ? hr.width / hr.height : V.cam.aspect || 1;
    return Math.max(h / 2 / tn, w / 2 / (tn * asp)) * (hr.height < 480 ? 1.3 : 1.16);
  }
  function viewerFrame() {
    const d = vFit();
    V.dist0 = d;
    V.dist = d;
    V.cam.position.set(0, 0, d);
    V.cam.lookAt(0, 0, 0);
    V.yaw = 0;
    V.vel = 0;
    V.lastUp = performance.now();
    vYaw();
  }
  /* ===================== Ficha de producto ===================== */
  const PD: any = { pid: null, color: null, size: null, qty: 1 };
  function openProduct(pid: string, color?: string, size?: string) {
    const p = (PROD as any)[pid];
    if (!p) return;
    PD.pid = pid;
    PD.color = color && (p.colors.includes(color) || color.startsWith("custom:")) ? color : p.def;
    PD.size = size || (p.sizes.length > 1 ? "M" : "Única");
    PD.qty = 1;
    $("#pdName").textContent = p.name;
    $("#pdPrice").textContent = fmt(p.price);
    $("#pdDesc").textContent = p.desc;
    const bd = $("#pdBadge");
    bd.textContent = p.badge;
    bd.className = "badge" + (p.badge === "Básico" ? " b-basico" : p.badge === "Accesorio" ? " b-acc" : "");
    $("#pdColors").innerHTML =
      p.colors
        .map((c: string) => {
          const ci = colorInfo(c);
          return `<button type="button" class="sw" data-c="${c}" style="background:${ci.hex}" aria-label="${esc(ci.name)}" title="${esc(ci.name)}"></button>`;
        })
        .join("") +
      `<label class="sw custom" title="Otro color (bajo pedido)"><input type="color" id="pdCustom" value="#3A7BD5" aria-label="Elegir otro color, bajo pedido"></label>`;
    $("#pdSizes").innerHTML = p.sizes.map((s: string) => `<button type="button" class="sz" data-s="${s}">${s}</button>`).join("");
    $("#pdFine").innerHTML = `Medidas de ejemplo, tolerancia ±1,5 cm. Precio de ejemplo — MVP de demostración. <span class="ex">ejemplo</span>`;
    ($("#pdGuide") as any).open = false;
    openDlg("#dlgProduct");
    attachStudio("#pdStage", "viewer");
    syncPD(true);
  }
  function syncPD(reframe?: boolean) {
    const p = (PROD as any)[PD.pid];
    $$("#pdColors .sw[data-c]").forEach((b: any) => b.setAttribute("aria-pressed", String(b.dataset.c === PD.color)));
    const cs = $(".sw.custom", $("#pdColors"));
    if (cs) cs.setAttribute("aria-pressed", String(PD.color.startsWith("custom:")));
    $$("#pdSizes .sz").forEach((b: any) => b.setAttribute("aria-pressed", String(b.dataset.s === PD.size)));
    $("#pdColorName").textContent = colorInfo(PD.color).name;
    $("#pdSizeName").textContent = PD.size;
    $("#pdQty").textContent = String(PD.qty);
    const G = (GUIDES as any)[p.guide];
    $("#pdGuideTable").innerHTML = `<table class="guide"><thead><tr>${G.cols
      .map((c: string) => `<th scope="col">${esc(c)}</th>`)
      .join("")}</tr></thead><tbody>${G.rows
      .map((r: any[]) => `<tr class="${r[0] === PD.size ? "sel" : ""}">${r.map((v, i) => (i ? `<td>${esc(v)}</td>` : `<th scope="row">${esc(v)}</th>`)).join("")}</tr>`)
      .join("")}</tbody></table>`;
    $("#pdAdd").textContent = `Agregar al carrito · ${fmt(p.price * PD.qty)}`;
    viewerModel(PD.pid, PD.color, PD.size);
    if (reframe) viewerFrame();
  }
  on($("#pdColors"), "click", (e: MouseEvent) => {
    const b = (e.target as HTMLElement).closest(".sw[data-c]") as HTMLElement;
    if (b) {
      PD.color = b.dataset.c;
      syncPD();
    }
  });
  on($("#pdColors"), "change", (e: Event) => {
    if ((e.target as HTMLElement).id === "pdCustom") {
      PD.color = "custom:" + (e.target as HTMLInputElement).value;
      syncPD();
    }
  });
  on($("#pdSizes"), "click", (e: MouseEvent) => {
    const b = (e.target as HTMLElement).closest(".sz") as HTMLElement;
    if (b) {
      PD.size = b.dataset.s;
      syncPD();
    }
  });
  on($("#pdMinus"), "click", () => {
    PD.qty = Math.max(1, PD.qty - 1);
    syncPD();
  });
  on($("#pdPlus"), "click", () => {
    PD.qty = Math.min(20, PD.qty + 1);
    syncPD();
  });
  on($("#pdReset"), "click", () => VH.reset());
  function addProductToCart(pid: string, size: string, color: string, qty: number) {
    const p = (PROD as any)[pid];
    const ci = colorInfo(color);
    useCartStore.getState().addItem({ productId: pid, name: p.name, priceCOP: p.price, size, colorId: color, colorName: ci.name } as CartLine, qty);
  }
  on($("#pdAdd"), "click", () => {
    addProductToCart(PD.pid, PD.size, PD.color, PD.qty);
    closeDlg("#dlgProduct");
    toast(`${(PROD as any)[PD.pid].short} agregado al carrito`, "Ver carrito", () => useCartStore.getState().open());
  });

  /* ===================== Arma tu outfit ===================== */
  const OF_TOPS = ["drop-zone-hoodie", "flow-line-tee", "terminal-tee", "aero-jersey-45"];
  const OF_BOTS = ["exit-point-trouser"];
  const OF: any = {
    scene: null,
    cam: null,
    root: null,
    wear: null,
    floor: null,
    pieces: [],
    yaw: 0,
    vel: 0,
    drag: false,
    lastUp: 0,
    photo: false,
    off: { x: 0, y: 0, s: 1, r: 0 },
    url: null,
    st: { top: "drop-zone-hoodie", topC: "graphite", topS: "M", bot: "exit-point-trouser", botC: "graphite", botS: "M" },
  };
  const OFH = {
    down() {
      OF.drag = true;
      OF.vel = 0;
    },
    drag(dx: number, dy: number) {
      if (OF.photo) {
        const h = studio.host.getBoundingClientRect().height,
          vis = 2 * OF.cam.position.z * Math.tan((OF.cam.fov * PI) / 360);
        OF.off.x += (dx * vis) / h;
        OF.off.y -= (dy * vis) / h;
        placeWear();
      } else {
        OF.yaw = clamp(OF.yaw + dx * 0.004, -0.3, 0.3);
        OF.vel = dx * 0.01;
        ofYaw();
      }
    },
    up() {
      OF.drag = false;
      OF.lastUp = performance.now();
    },
    pinch(r: number, p0: any) {
      if (OF.photo) {
        OF.off.s = clamp(p0.scale * r, 0.3, 2.2);
        ($("#ofScale") as HTMLInputElement).value = String(OF.off.s);
        placeWear();
      }
    },
    wheel(d: number) {
      if (OF.photo) {
        OF.off.s = clamp(OF.off.s * (1 - d * 0.001), 0.3, 2.2);
        ($("#ofScale") as HTMLInputElement).value = String(OF.off.s);
        placeWear();
      }
    },
    reset() {
      if (OF.photo) {
        OF.off = { x: 0, y: 0, s: 1, r: 0 };
        ($("#ofScale") as HTMLInputElement).value = "1";
        ($("#ofRot") as HTMLInputElement).value = "0";
        placeWear();
      } else {
        OF.yaw = 0;
        OF.vel = 0;
        ofYaw();
      }
      studio.needs = true;
    },
    tick(now: number) {
      if (OF.photo || OF.drag) return;
      if (Math.abs(OF.vel) > 0.0005) {
        OF.yaw = clamp(OF.yaw + OF.vel, -0.3, 0.3);
        OF.vel *= 0.92;
        ofYaw();
      } else if (!reduced && now - OF.lastUp > 1400) {
        const tg = 0.1 * Math.sin(now / 1800);
        if (Math.abs(tg - OF.yaw) > 0.0005) {
          OF.yaw += (tg - OF.yaw) * 0.03;
          ofYaw();
        }
      }
    },
  };
  function ofBuildUI() {
    const st = OF.st;
    const opt = (pid: string, on_: boolean) =>
      `<button type="button" class="opt" data-pid="${pid}" aria-pressed="${on_}">${esc((PROD as any)[pid].short)}<small>${fmt((PROD as any)[pid].price)}</small></button>`;
    $("#ofTop").innerHTML = OF_TOPS.map((p) => opt(p, p === st.top)).join("");
    $("#ofBot").innerHTML = OF_BOTS.map((p) => opt(p, p === st.bot)).join("");
    const sws = (pid: string, sel: string) =>
      (PROD as any)[pid].colors
        .map((c: string) => {
          const ci = colorInfo(c);
          return `<button type="button" class="sw" data-c="${c}" style="background:${ci.hex}" aria-label="${esc(ci.name)}" title="${esc(ci.name)}" aria-pressed="${c === sel}"></button>`;
        })
        .join("");
    $("#ofTopC").innerHTML = sws(st.top, st.topC);
    $("#ofBotC").innerHTML = sws(st.bot, st.botC);
    const sizes = (sel: string) => SIZES.map((s) => `<option ${s === sel ? "selected" : ""}>${s}</option>`).join("");
    ($("#ofTopS") as any).innerHTML = sizes(st.topS);
    ($("#ofBotS") as any).innerHTML = sizes(st.botS);
    const total = (PROD as any)[st.top].price + (PROD as any)[st.bot].price;
    $("#ofTotal").textContent = fmt(total);
    $("#ofCount").textContent = `2 prendas · total en vivo`;
  }
  function ofBuildScene() {
    const S = getStudio();
    if (!OF.scene) {
      OF.scene = S.mkScene();
      OF.cam = new T.PerspectiveCamera(30, 1, 0.05, 40);
      OF.root = new T.Group();
      OF.scene.add(OF.root);
      OF.wear = new T.Group();
      OF.root.add(OF.wear);
      const fl = M(new T.CircleGeometry(0.6, 40), new T.MeshBasicMaterial({ map: SHADOW, transparent: true, depthWrite: false }));
      fl.rotation.x = -PI / 2;
      fl.position.y = 0.002;
      OF.root.add(fl);
      OF.floor = fl;
    }
    while (OF.wear.children.length) OF.wear.remove(OF.wear.children[0]);
    const st = OF.st,
      top = flatGarment(st.top, st.topC),
      bot = flatGarment(st.bot, st.botC);
    top.position.set(0, 1.47, 0.02);
    bot.position.set(0, 1.06, 0);
    OF.wear.add(bot);
    OF.wear.add(top);
    OF.pieces = [top, bot];
    ofYaw();
    OF.cam.position.set(0, 1.0, 4.3);
    OF.cam.lookAt(0, 0.95, 0);
    placeWear();
    S.needs = true;
  }
  function ofYaw() {
    if (!OF.root) return;
    OF.root.rotation.set(0, OF.yaw, 0);
    OF.pieces.forEach((p: any) => p.userData.fade(OF.yaw));
    if (studio) studio.needs = true;
  }
  function placeWear() {
    if (!OF.root) return;
    if (OF.photo) {
      OF.root.rotation.set(0, 0, (-OF.off.r * PI) / 180);
      OF.pieces.forEach((p: any) => p.userData.fade(0));
      OF.root.position.set(OF.off.x, OF.off.y, 0);
      OF.root.scale.setScalar(OF.off.s);
    } else {
      OF.root.position.set(0, 0, 0);
      OF.root.scale.setScalar(1);
      ofYaw();
    }
    OF.floor.visible = !OF.photo;
    if (studio) studio.needs = true;
  }
  function openOutfit() {
    openDlg("#dlgOutfit");
    ofBuildUI();
    attachStudio("#ofStage", "outfit");
    ofBuildScene();
  }
  function ofClick(slotName: "top" | "bot") {
    return (e: MouseEvent) => {
      const b = (e.target as HTMLElement).closest(".opt") as HTMLElement;
      if (!b) return;
      const st = OF.st,
        pid = b.dataset.pid!;
      if (slotName === "top") {
        st.top = pid;
        if (!(PROD as any)[pid].colors.includes(st.topC)) st.topC = (PROD as any)[pid].def;
      } else {
        st.bot = pid;
        if (!(PROD as any)[pid].colors.includes(st.botC)) st.botC = (PROD as any)[pid].def;
      }
      ofBuildUI();
      ofBuildScene();
    };
  }
  function ofColor(slotName: "topC" | "botC") {
    return (e: MouseEvent) => {
      const b = (e.target as HTMLElement).closest(".sw") as HTMLElement;
      if (!b) return;
      OF.st[slotName] = b.dataset.c;
      ofBuildUI();
      ofBuildScene();
    };
  }
  on($("#ofTop"), "click", ofClick("top"));
  on($("#ofBot"), "click", ofClick("bot"));
  on($("#ofTopC"), "click", ofColor("topC"));
  on($("#ofBotC"), "click", ofColor("botC"));
  on($("#ofTopS"), "change", (e: Event) => {
    OF.st.topS = (e.target as HTMLSelectElement).value;
  });
  on($("#ofBotS"), "change", (e: Event) => {
    OF.st.botS = (e.target as HTMLSelectElement).value;
  });
  on($("#ofAdd"), "click", () => {
    const st = OF.st;
    addProductToCart(st.top, st.topS, st.topC, 1);
    addProductToCart(st.bot, st.botS, st.botC, 1);
    closeDlg("#dlgOutfit");
    toast("Outfit agregado al carrito", "Ver carrito", () => useCartStore.getState().open());
  });
  // Foto: solo se muestra en pantalla. No se sube ni se guarda; al cerrar se borra.
  function setPhoto(file?: File) {
    if (!file) return;
    if (OF.url) URL.revokeObjectURL(OF.url);
    OF.url = URL.createObjectURL(file);
    const im = $("#ofPhoto") as HTMLImageElement;
    im.src = OF.url;
    im.hidden = false;
    OF.photo = true;
    OF.off = { x: 0, y: -0.15, s: 1, r: 0 };
    ($("#ofScale") as HTMLInputElement).value = "1";
    ($("#ofRot") as HTMLInputElement).value = "0";
    $("#ofStage").classList.add("photo");
    $("#ofPhotoCtl").hidden = false;
    $("#ofPhotoOff").hidden = false;
    $("#ofHint").textContent = "Arrastra la ropa para acomodarla · pellizca para cambiar el tamaño";
    placeWear();
  }
  function clearPhoto() {
    if (OF.url) {
      URL.revokeObjectURL(OF.url);
      OF.url = null;
    }
    const im = $("#ofPhoto") as HTMLImageElement;
    im.removeAttribute("src");
    im.hidden = true;
    ($("#ofCam") as HTMLInputElement).value = "";
    ($("#ofFile") as HTMLInputElement).value = "";
    OF.photo = false;
    $("#ofStage").classList.remove("photo");
    $("#ofPhotoCtl").hidden = true;
    $("#ofPhotoOff").hidden = true;
    $("#ofHint").textContent = "Arrastra para inclinar el outfit";
    if (OF.root) placeWear();
  }
  on($("#ofCamBtn"), "click", () => $("#ofCam").click());
  on($("#ofFileBtn"), "click", () => $("#ofFile").click());
  on($("#ofCam"), "change", (e: Event) => setPhoto((e.target as HTMLInputElement).files?.[0]));
  on($("#ofFile"), "change", (e: Event) => setPhoto((e.target as HTMLInputElement).files?.[0]));
  on($("#ofPhotoOff"), "click", clearPhoto);
  on($("#ofScale"), "input", (e: Event) => {
    OF.off.s = +(e.target as HTMLInputElement).value;
    placeWear();
  });
  on($("#ofRot"), "input", (e: Event) => {
    OF.off.r = +(e.target as HTMLInputElement).value;
    placeWear();
  });

  /* ===================== Catálogo en lista ===================== */
  let catFilter = "todo";
  function openCatalog() {
    renderCatalog();
    openDlg("#dlgCatalog");
  }
  function renderCatalog() {
    const F = [
      ["todo", "Todo"],
      ["arriba", "Arriba"],
      ["abajo", "Abajo"],
      ["accesorio", "Accesorios"],
    ].filter(([k]) => k === "todo" || PRODUCTS.some((p) => p.cat === k));
    $("#catFilters").innerHTML = F.map(([k, n]) => `<button type="button" class="opt" data-f="${k}" aria-pressed="${k === catFilter}">${n}</button>`).join("");
    const where = (pid: string) => {
      const i = rail.findIndex((r) => r.kind === "g" && r.pid === pid);
      return i < 0 ? 0 : i;
    };
    $("#catGrid").innerHTML = PRODUCTS.filter((p) => catFilter === "todo" || p.cat === catFilter)
      .map(
        (p) =>
          `<article class="pc"><img alt="${esc(p.name)} en ${esc(colorInfo(p.def).name)}" data-thumb="${p.id}|${p.def}" src="${thumbCache.get(p.id + "|" + p.def) || ""}" loading="lazy"><div class="pcb"><span class="badge ${p.badge === "Básico" ? "b-basico" : p.badge === "Accesorio" ? "b-acc" : ""}" style="align-self:flex-start">${esc(p.badge)}</span><h3>${esc(p.name)}</h3><span class="meta">${p.colors.length} colores · ${p.sizes.length > 1 ? "tallas " + p.sizes[0] + " a " + p.sizes[p.sizes.length - 1] : "talla única"}</span><div class="row"><button class="btn primary" type="button" data-open="${p.id}">Ver y elegir</button><button class="btn" type="button" data-go="${where(p.id)}">En la tienda</button></div></div></article>`,
      )
      .join("");
    wantThumbs($("#catGrid"));
  }
  on($("#catFilters"), "click", (e: MouseEvent) => {
    const b = (e.target as HTMLElement).closest("[data-f]") as HTMLElement;
    if (b) {
      catFilter = b.dataset.f!;
      renderCatalog();
    }
  });
  on($("#catGrid"), "click", (e: MouseEvent) => {
    const o = (e.target as HTMLElement).closest("[data-open]") as HTMLElement;
    if (o) {
      closeDlg("#dlgCatalog");
      openProduct(o.dataset.open!);
      return;
    }
    const g = (e.target as HTMLElement).closest("[data-go]") as HTMLElement;
    if (g) {
      closeDlg("#dlgCatalog");
      hideGuide();
      goTo(+g.dataset.go!);
    }
  });

  /* ===================== Envíos, cambios y pagos (ejemplo) ===================== */
  $("#infoGrid").innerHTML = `
<section><h3>El Ropero <span class="ex">ejemplo</span></h3><p>Este riel 3D es una muestra interactiva del catálogo de FORTY FIVE: gira, acércate y arma tu outfit antes de agregarlo al carrito.</p></section>
<section><h3>Tallas</h3><p>Cada prenda incluye una guía de medidas en centímetros, con tolerancia de ±1,5 cm. Medidas de ejemplo.</p></section>
<section><h3>MVP de demostración</h3><p>Productos, precios y existencias son simulados — no son referencias comerciales confirmadas. El carrito usa el mismo checkout de ejemplo del resto del sitio.</p></section>`;

  /* ===================== Ventanas y avisos ===================== */
  let dlgPushed = false;
  function openDlg(sel: string) {
    const d = $(sel) as HTMLDialogElement;
    if (!dlgPushed && !$("dialog[open]")) {
      try {
        history.pushState({ ropero: 1 }, "");
        dlgPushed = true;
      } catch {
        /* ignore */
      }
    }
    $$("dialog[open]").forEach((o: any) => {
      if (o !== d) o.close();
    });
    if (!d.open) d.showModal();
  }
  function closeDlg(sel: string) {
    const d = $(sel) as HTMLDialogElement;
    if (d.open) d.close();
  }
  const onPopstate = () => {
    if (dlgPushed) {
      dlgPushed = false;
      $$("dialog[open]").forEach((o: any) => o.close());
    }
  };
  on(window, "popstate", onPopstate);
  $$("dialog").forEach((d: any) => {
    let downOut = false;
    on(d, "pointerdown", (e: PointerEvent) => {
      downOut = e.target === d;
    });
    on(d, "click", (e: MouseEvent) => {
      if ((e.target === d && downOut) || (e.target as HTMLElement).closest("[data-close]")) d.close();
      downOut = false;
    });
    on(d, "close", () => {
      const t = $("#toast");
      if (d.contains(t)) root.appendChild(t);
      setTimeout(() => {
        if (dlgPushed && !$("dialog[open]")) {
          dlgPushed = false;
          try {
            history.back();
          } catch {
            /* ignore */
          }
        }
      }, 0);
      if (d.id === "dlgProduct" && studio && studio.mode === "viewer") detachStudio();
      if (d.id === "dlgOutfit") {
        clearPhoto();
        if (studio && studio.mode === "outfit") detachStudio();
      }
    });
  });
  on($("#btnCatalog"), "click", openCatalog);
  on($("#btnOutfit"), "click", openOutfit);
  on($("#btnCart"), "click", () => useCartStore.getState().open());
  on($("#brandLink"), "click", (e: Event) => {
    e.preventDefault();
    hideGuide();
    goTo(0);
  });
  let toastT: any = null;
  function toast(msg: string, label?: string, fn?: () => void) {
    const t = $("#toast");
    clearTimeout(toastT);
    t.innerHTML = `<span>${esc(msg)}</span>`;
    if (label) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.onclick = () => {
        t.hidden = true;
        fn && fn();
      };
      t.appendChild(b);
    }
    const host = $("dialog[open]") || root;
    host.appendChild(t);
    t.hidden = false;
    toastT = setTimeout(() => (t.hidden = true), label === "Deshacer" ? 6000 : 3500);
  }

  /* ===================== Carrito: sincroniza la insignia con el carrito real ===================== */
  function syncCartBadge() {
    const n = cartCount(useCartStore.getState().lines);
    const b = $("#cartCount");
    b.textContent = String(n);
    b.classList.toggle("zero", !n);
  }
  const unsubCart = useCartStore.subscribe(syncCartBadge);
  cleanups.push(unsubCart);

  /* ===================== Arranque ===================== */
  let destroyed = false;
  function relayout() {
    renderer.setSize(vw(), vh(), false);
    frameCam();
    invalidate();
  }
  async function init() {
    try {
      await Promise.race([
        Promise.all([(document as any).fonts.load(`800 40px ${DISPLAY}`), (document as any).fonts.load(`600 20px ${MONO}`), (document as any).fonts.load(`600 20px ${BODY}`)]),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    } catch {
      /* ignore */
    }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.VSMShadowMap;
    buildRail();
    scene.updateMatrixWorld(true);
    renderer.setSize(vw(), vh(), false);
    syncCartBadge();
    frameCam();
    goTo(0, true);
    placeGuide();
    raf(frameLoop);
    on(canvas, "webglcontextlost", (e: Event) => e.preventDefault());
    on(canvas, "webglcontextrestored", () => location.reload());
    let roT: any = null;
    const ro = new ResizeObserver(() => {
      clearTimeout(roT);
      roT = setTimeout(relayout, 60);
    });
    ro.observe(root);
    cleanups.push(() => ro.disconnect());
    on(window, "resize", () => {
      clearTimeout(roT);
      roT = setTimeout(relayout, 60);
    });
    setTimeout(() => {
      $("#loading").classList.add("done");
      setTimeout(() => {
        $("#loading").hidden = true;
      }, 600);
    }, 150);
    setTimeout(() => {
      wantThumbs();
      PRODUCTS.forEach((p) => thumb(p.id, p.def));
    }, 400);
  }
  init().catch((err) => {
    console.error(err);
    showFallback();
  });

  return function destroy() {
    destroyed = true;
    rafIds.forEach((id) => cancelAnimationFrame(id));
    cleanups.forEach((fn) => fn());
    try {
      renderer.dispose();
    } catch {
      /* ignore */
    }
    try {
      if (studio) studio.r.dispose();
    } catch {
      /* ignore */
    }
  };
}
