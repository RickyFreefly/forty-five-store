import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryFlyout } from "./CategoryFlyout";
import { useProductFocusStore } from "../../store/productFocus";
import { clothingProducts } from "../../data/products";

describe("CategoryFlyout", () => {
  afterEach(() => useProductFocusStore.getState().close());

  it("does not render children when closed", () => {
    render(
      <CategoryFlyout id="f1" open={false} onClose={() => {}}>
        <p>contenido</p>
      </CategoryFlyout>,
    );
    expect(screen.queryByText("contenido")).not.toBeInTheDocument();
  });

  it("renders children with the given id when open", () => {
    render(
      <CategoryFlyout id="f1" open onClose={() => {}}>
        <p>contenido</p>
      </CategoryFlyout>,
    );
    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(document.getElementById("f1")).toBeInTheDocument();
  });

  it("calls onClose on Escape", async () => {
    const onClose = vi.fn();
    render(
      <CategoryFlyout id="f1" open onClose={onClose}>
        <p>contenido</p>
      </CategoryFlyout>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the backdrop is clicked, not when children are clicked", async () => {
    const onClose = vi.fn();
    render(
      <CategoryFlyout id="f1" open onClose={onClose}>
        <button type="button">adentro</button>
      </CategoryFlyout>,
    );
    await userEvent.click(screen.getByText("adentro"));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("category-flyout-backdrop"));
    expect(onClose).toHaveBeenCalled();
  });

  it("ignores Escape while a product focus view is open (that view owns Escape)", async () => {
    const onClose = vi.fn();
    render(
      <CategoryFlyout id="f1" open onClose={onClose}>
        <p>contenido</p>
      </CategoryFlyout>,
    );
    useProductFocusStore.getState().open(clothingProducts[0]);
    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();

    useProductFocusStore.getState().close();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
