import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductGrid } from "./ProductGrid";
import { clothingProducts } from "../../data/products";

describe("ProductGrid", () => {
  it("shows EmptyCatalogState when there are no products", () => {
    render(<ProductGrid products={[]} slots={6} />);
    expect(screen.getByText(/todavía no hay prendas/i)).toBeInTheDocument();
  });

  it("renders every product and no pagination when they fit one page", () => {
    const subset = clothingProducts.slice(0, 3);
    render(<ProductGrid products={subset} slots={6} pageSize={6} />);
    subset.forEach((p) => expect(screen.getByText(p.name)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /siguiente/i })).not.toBeInTheDocument();
  });

  it("does not show pagination when products.length === pageSize exactly", () => {
    const subset = clothingProducts.slice(0, 2);
    render(<ProductGrid products={subset} slots={2} pageSize={2} />);
    expect(screen.queryByRole("button", { name: /siguiente/i })).not.toBeInTheDocument();
  });

  it("paginates when there are more products than pageSize, and Next advances the page", async () => {
    render(<ProductGrid products={clothingProducts} slots={6} pageSize={2} />);
    expect(screen.getByText(clothingProducts[0].name)).toBeInTheDocument();
    expect(screen.queryByText(clothingProducts[2].name)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    expect(screen.getByText(clothingProducts[2].name)).toBeInTheDocument();
    expect(screen.queryByText(clothingProducts[0].name)).not.toBeInTheDocument();
  });
});
