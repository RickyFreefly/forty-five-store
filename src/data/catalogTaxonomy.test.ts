import { describe, it, expect } from "vitest";
import { resolveCatalogSlice, matchesGender, CATALOG_CATEGORIES } from "./catalogTaxonomy";
import { clothingProducts } from "./products";

describe("CATALOG_CATEGORIES", () => {
  it("has the four categories from the spec with their slot counts", () => {
    const bySlots = Object.fromEntries(CATALOG_CATEGORIES.map((c) => [c.id, c]));
    expect(bySlots["technical-suits"].subcategories).toEqual([
      { id: "hibridos", label: "Híbridos", slots: 4 },
      { id: "skydiving", label: "Skydiving", slots: 2 },
      { id: "tunel", label: "Túnel", slots: 2 },
    ]);
    expect(bySlots["upper"].slots).toBe(6);
    expect(bySlots["lower"].slots).toBe(6);
    expect(bySlots["streetwear"].subcategories?.map((s) => s.id)).toEqual(["cabeza", "sup", "inf"]);
  });
});

describe("resolveCatalogSlice", () => {
  it("returns [] for technical-suits regardless of gender/subcategory", () => {
    expect(resolveCatalogSlice("technical-suits", "M", "hibridos")).toEqual([]);
    expect(resolveCatalogSlice("technical-suits", "F", "skydiving")).toEqual([]);
  });

  it("returns [] for streetwear regardless of gender/subcategory", () => {
    expect(resolveCatalogSlice("streetwear", "M", "cabeza")).toEqual([]);
  });

  it("returns real superior-group products for upper, same for both genders when ungendered", () => {
    const m = resolveCatalogSlice("upper", "M");
    const f = resolveCatalogSlice("upper", "F");
    expect(m.map((p) => p.id).sort()).toEqual(f.map((p) => p.id).sort());
    expect(m.map((p) => p.id)).toContain("flow-line-tee");
    expect(m.every((p) => p.group === "superior")).toBe(true);
  });

  it("returns real inferior-group products for lower", () => {
    const lower = resolveCatalogSlice("lower", "M");
    expect(lower.map((p) => p.id)).toContain("exit-point-trouser");
    expect(lower.every((p) => p.group === "inferior")).toBe(true);
  });

  it("includes every upper product in both M and F today (none is gendered yet)", () => {
    const upperM = resolveCatalogSlice("upper", "M").map((p) => p.id);
    const upperF = resolveCatalogSlice("upper", "F").map((p) => p.id);
    expect(upperM).toEqual(upperF);
  });
});

describe("matchesGender", () => {
  const base = clothingProducts[0];

  it("matches when the product has no gender set", () => {
    expect(matchesGender({ ...base, gender: undefined }, "M")).toBe(true);
    expect(matchesGender({ ...base, gender: undefined }, "F")).toBe(true);
  });

  it("matches only its own gender when one is set", () => {
    expect(matchesGender({ ...base, gender: "F" }, "F")).toBe(true);
    expect(matchesGender({ ...base, gender: "F" }, "M")).toBe(false);
  });
});
