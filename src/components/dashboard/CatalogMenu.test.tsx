import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CatalogMenu } from "./CatalogMenu";
import { ProductFocusView } from "../ProductFocusView";
import { useProductFocusStore } from "../../store/productFocus";

/** Mirrors App.tsx: the product focus view is driven by the productFocus store. */
function FocusHost() {
  const product = useProductFocusStore((s) => s.product);
  const close = useProductFocusStore((s) => s.close);
  return product ? <ProductFocusView product={product} onClose={close} /> : null;
}

describe("CatalogMenu", () => {
  afterEach(() => useProductFocusStore.getState().close());

  it("renders a trigger for each of the four categories plus Accesorios", () => {
    render(<CatalogMenu />);
    expect(screen.getByRole("button", { name: /technical suits/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /prendas superiores/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /prendas inferiores/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /streetwear/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accesorios/i })).toBeInTheDocument();
  });

  it("opening a second category closes the first", async () => {
    render(<CatalogMenu />);
    const upperTrigger = screen.getByRole("button", { name: /prendas superiores/i });
    const lowerTrigger = screen.getByRole("button", { name: /prendas inferiores/i });

    await userEvent.click(upperTrigger);
    expect(upperTrigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(lowerTrigger);
    expect(lowerTrigger).toHaveAttribute("aria-expanded", "true");
    expect(upperTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("clicking an open trigger again closes it", async () => {
    render(<CatalogMenu />);
    const upperTrigger = screen.getByRole("button", { name: /prendas superiores/i });
    await userEvent.click(upperTrigger);
    expect(upperTrigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(upperTrigger);
    expect(upperTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps focus on the newly opened trigger when switching categories", async () => {
    render(<CatalogMenu />);
    const upperTrigger = screen.getByRole("button", { name: /prendas superiores/i });
    const lowerTrigger = screen.getByRole("button", { name: /prendas inferiores/i });

    await userEvent.click(upperTrigger);
    lowerTrigger.focus();
    await userEvent.keyboard("{Enter}");

    expect(lowerTrigger).toHaveAttribute("aria-expanded", "true");
    expect(upperTrigger).toHaveAttribute("aria-expanded", "false");
    expect(lowerTrigger).toHaveFocus();
  });

  it("Escape with a product open closes only the product view, not the category flyout", async () => {
    render(
      <>
        <CatalogMenu />
        <FocusHost />
      </>,
    );
    const upperTrigger = screen.getByRole("button", { name: /prendas superiores/i });
    await userEvent.click(upperTrigger);
    await userEvent.click(screen.getByText("Flow Line Tee").closest("button")!);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(useProductFocusStore.getState().product).toBeNull();
    expect(upperTrigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard("{Escape}");
    expect(upperTrigger).toHaveAttribute("aria-expanded", "false");
  });
});
