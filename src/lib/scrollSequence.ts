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

/** Destination rect that draws an image like CSS `object-fit: cover`, centred. */
export function coverRect(imgW: number, imgH: number, boxW: number, boxH: number) {
  const scale = Math.max(boxW / imgW, boxH / imgH);
  const dw = imgW * scale;
  const dh = imgH * scale;
  return { dx: (boxW - dw) / 2, dy: (boxH - dh) / 2, dw, dh };
}
