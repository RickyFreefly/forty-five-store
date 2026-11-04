import { describe, it, expect } from "vitest";
import { coverRect, formatAltitude, nearestLoaded, preloadOrder, progressToAltitude, progressToFrame } from "./scrollSequence";

describe("progressToFrame", () => {
  it("maps 0 to the first frame and 1 to the last", () => {
    expect(progressToFrame(0, 30)).toBe(0);
    expect(progressToFrame(1, 30)).toBe(29);
  });

  it("returns a fractional index between frames for interpolation", () => {
    expect(progressToFrame(0.5, 31)).toBe(15);
    expect(progressToFrame(0.5, 30)).toBeCloseTo(14.5);
  });

  it("clamps progress outside 0..1", () => {
    expect(progressToFrame(-0.2, 30)).toBe(0);
    expect(progressToFrame(1.4, 30)).toBe(29);
  });

  it("handles a single-frame or empty sequence", () => {
    expect(progressToFrame(0.7, 1)).toBe(0);
    expect(progressToFrame(0.7, 0)).toBe(0);
  });
});

describe("progressToAltitude", () => {
  it("drops from 4000 m to 0 m by default", () => {
    expect(progressToAltitude(0)).toBe(4000);
    expect(progressToAltitude(0.25)).toBe(3000);
    expect(progressToAltitude(1)).toBe(0);
  });

  it("accepts a custom exit altitude and clamps", () => {
    expect(progressToAltitude(0.5, 4500)).toBe(2250);
    expect(progressToAltitude(-1)).toBe(4000);
    expect(progressToAltitude(2)).toBe(0);
  });

  it("formats with a thousands dot, as written in Colombia", () => {
    expect(formatAltitude(4000)).toBe("4.000");
    expect(formatAltitude(812.6)).toBe("813");
    expect(formatAltitude(0)).toBe("0");
  });
});

describe("preloadOrder", () => {
  it("loads every 4th frame first, then the rest, without repeats", () => {
    const order = preloadOrder(10);
    expect(order.slice(0, 3)).toEqual([0, 4, 8]);
    expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("always includes the last frame in the first pass", () => {
    expect(preloadOrder(10).slice(0, 4)).toEqual([0, 4, 8, 9]);
  });
});

describe("nearestLoaded", () => {
  it("returns the index itself when loaded", () => {
    expect(nearestLoaded(3, [true, true, true, true])).toBe(3);
  });

  it("falls back to the closest loaded frame", () => {
    expect(nearestLoaded(5, [true, false, false, false, true, false, false, false, true])).toBe(4);
    expect(nearestLoaded(7, [true, false, false, false, true, false, false, false, true])).toBe(8);
  });

  it("returns -1 when nothing is loaded yet", () => {
    expect(nearestLoaded(2, [false, false, false])).toBe(-1);
  });
});

describe("coverRect", () => {
  it("fills a taller canvas by cropping the sides", () => {
    const r = coverRect(1600, 900, 375, 812);
    expect(r.dh).toBe(812);
    expect(r.dw).toBeCloseTo(1443.6, 1);
    expect(r.dx).toBeCloseTo((375 - r.dw) / 2);
    expect(r.dy).toBe(0);
  });

  it("fills a wider canvas by cropping top and bottom", () => {
    const r = coverRect(1600, 900, 2000, 900);
    expect(r.dw).toBe(2000);
    expect(r.dy).toBeCloseTo((900 - 1125) / 2);
  });
});
