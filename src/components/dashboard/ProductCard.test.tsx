import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "./ProductCard";
import { useProductFocusStore } from "../../store/productFocus";
import { clothingProducts } from "../../data/products";

const product = clothingProducts.find((p) => p.id === "flow-line-tee")!;
const outOfStock = { ...product, id: "x", stock: 0 };

beforeEach(() => {
  useProductFocusStore.setState({ product: null });
});

describe("ProductCard", () => {
  it("shows name, sku and formatted price", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText(product.name)).toBeInTheDocument();
    expect(screen.getByText(product.sku)).toBeInTheDocument();
    expect(screen.getByText(/109\.900/)).toBeInTheDocument();
  });

  it("shows availability text for an in-stock product", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText(/en stock/i)).toBeInTheDocument();
  });

  it("shows 'Agotado' for a product with stock 0", () => {
    render(<ProductCard product={outOfStock} />);
    expect(screen.getByText(/agotado/i)).toBeInTheDocument();
  });

  it("opens the product focus store on click", async () => {
    render(<ProductCard product={product} />);
    await userEvent.click(screen.getByRole("button"));
    expect(useProductFocusStore.getState().product).toBe(product);
  });
});
