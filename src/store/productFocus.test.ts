import { describe, it, expect, beforeEach } from "vitest";
import { useProductFocusStore } from "./productFocus";
import { clothingProducts } from "../data/products";

const [tee, hoodie] = clothingProducts;

beforeEach(() => {
  useProductFocusStore.setState({ product: null });
});

describe("useProductFocusStore", () => {
  it("starts with no product", () => {
    expect(useProductFocusStore.getState().product).toBeNull();
  });

  it("open() sets the product", () => {
    useProductFocusStore.getState().open(tee);
    expect(useProductFocusStore.getState().product).toBe(tee);
  });

  it("open() replaces a previously open product", () => {
    useProductFocusStore.getState().open(tee);
    useProductFocusStore.getState().open(hoodie);
    expect(useProductFocusStore.getState().product).toBe(hoodie);
  });

  it("close() clears the product", () => {
    useProductFocusStore.getState().open(tee);
    useProductFocusStore.getState().close();
    expect(useProductFocusStore.getState().product).toBeNull();
  });
});
