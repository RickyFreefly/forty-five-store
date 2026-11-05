// Pure helpers for the scroll-driven image sequence (ScrollSequence / FreefallSection).
// Kept free of DOM and React so they can be unit-tested directly.

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Scroll progress (0..1) → fractional frame index (0..frameCount-1). The fraction drives the crossfade. */
export function progressToFrame(progress: number, frameCount: number): number {
  if (frameCount <= 1) return 0;
  return clamp01(progress) * (frameCount - 1);
}

export const EXIT_ALTITUDE_M = 4000;

/** Scroll progress (0..1) → altitude in metres, linear from the exit altitude down to the ground. */
export function progressToAltitude(progress: number, exitAltitude = EXIT_ALTITUDE_M): number {
  return exitAltitude * (1 - clamp01(progress));
}

/** "4.000" — whole metres with a dot as thousands separator (es-CO). */
export function formatAltitude(metres: number): string {
  return Math.round(metres).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Every `stride`-th frame (plus the last) first so the whole fall is scrubbable early, then the gaps. */
export function preloadOrder(frameCount: number, stride = 4): number[] {
  const first: number[] = [];
  for (let i = 0; i < frameCount; i += stride) first.push(i);
  if (frameCount > 0 && first[first.length - 1] !== frameCount - 1) first.push(frameCount - 1);
  const seen = new Set(first);
  const rest: number[] = [];
  for (let i = 0; i < frameCount; i++) if (!seen.has(i)) rest.push(i);
  return [...first, ...rest];
}

/** Closest loaded frame to `index` (ties prefer the earlier one), or -1 if none are loaded. */
export function nearestLoaded(index: number, loaded: readonly boolean[]): number {
  for (let d = 0; d < loaded.length; d++) {
    if (loaded[index - d]) return index - d;
    if (loaded[index + d]) return index + d;
  }
  return -1;
}

/**
 * Destination rect that fits a landscape frame to any screen without losing the subject.
 * Wide screens: like CSS `object-fit: cover`. Narrow/portrait screens: zooms out only until at
 * least `minVisibleW` of the frame width shows (bands above and below), and slides the crop
 * horizontally so `focusX` (0 = left edge, 1 = right edge) stays on screen.
 */
export function fitRect(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number,
  { focusX = 0.5, minVisibleW = 0.55, bandBias = 0.4 } = {},
) {
  const cover = Math.max(boxW / imgW, boxH / imgH);
  const contain = Math.min(boxW / imgW, boxH / imgH);
  const scale = Math.max(contain, Math.min(cover, boxW / (imgW * minVisibleW)));
  const dw = imgW * scale;
  const dh = imgH * scale;
  const dx = dw > boxW ? Math.min(0, Math.max(boxW - dw, boxW / 2 - focusX * dw)) : (boxW - dw) / 2;
  // Bands, when there are any, are split unevenly: a bit less on top, more room for copy below.
  const dy = dh < boxH ? (boxH - dh) * bandBias : (boxH - dh) / 2;
  return { dx, dy, dw, dh };
}

/** Piecewise-linear lookup through [progress, value] stops (sorted by progress). */
export function interpolateStops(stops: readonly (readonly [number, number])[], p: number): number {
  if (stops.length === 0) return 0.5;
  if (p <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [p1, v1] = stops[i];
    if (p <= p1) {
      const [p0, v0] = stops[i - 1];
      return v0 + ((v1 - v0) * (p - p0)) / (p1 - p0 || 1);
    }
  }
  return stops[stops.length - 1][1];
}

/** Destination rect that draws an image like CSS `object-fit: cover`, centred. */
export function coverRect(imgW: number, imgH: number, boxW: number, boxH: number) {
  const scale = Math.max(boxW / imgW, boxH / imgH);
  const dw = imgW * scale;
  const dh = imgH * scale;
  return { dx: (boxW - dw) / 2, dy: (boxH - dh) / 2, dw, dh };
}
