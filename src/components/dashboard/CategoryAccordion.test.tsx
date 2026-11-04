import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryAccordion } from "./CategoryAccordion";
import { CATALOG_CATEGORIES } from "../../data/catalogTaxonomy";

const upper = CATALOG_CATEGORIES.find((c) => c.id === "upper")!;
const technicalSuits = CATALOG_CATEGORIES.find((c) => c.id === "technical-suits")!;

describe("CategoryAccordion", () => {
  it("reflects isOpen via aria-expanded on the trigger", () => {
    const { rerender } = render(<CategoryAccordion category={upper} isOpen={false} onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: /prendas superiores/i })).toHaveAttribute("aria-expanded", "false");
    rerender(<CategoryAccordion category={upper} isOpen onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: /prendas superiores/i })).toHaveAttribute("aria-expanded", "true");
  });

  it("calls onToggle when the trigger is clicked", async () => {
    const onToggle = vi.fn();
    render(<CategoryAccordion category={upper} isOpen={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button", { name: /prendas superiores/i }));
    expect(onToggle).toHaveBeenCalled();
  });

  it("shows real products for upper when open, with no subcategory selector", () => {
    render(<CategoryAccordion category={upper} isOpen onToggle={() => {}} />);
    expect(screen.getByText("Flow Line Tee")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Híbridos" })).not.toBeInTheDocument();
  });

  it("shows the subcategory selector and empty state for technical-suits when open", () => {
    render(<CategoryAccordion category={technicalSuits} isOpen onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: "Híbridos" })).toBeInTheDocument();
    expect(screen.getByText(/todavía no hay prendas/i)).toBeInTheDocument();
  });

  it("does NOT move focus to its trigger when closed from outside (a sibling category opened)", () => {
    const { rerender } = render(
      <>
        <CategoryAccordion category={upper} isOpen onToggle={() => {}} />
        <button type="button">otra categoría</button>
      </>,
    );
    const trigger = screen.getByRole("button", { name: /prendas superiores/i });
    const sibling = screen.getByRole("button", { name: "otra categoría" });
    sibling.focus();
    rerender(
      <>
        <CategoryAccordion category={upper} isOpen={false} onToggle={() => {}} />
        <button type="button">otra categoría</button>
      </>,
    );
    expect(trigger).not.toHaveFocus();
    expect(sibling).toHaveFocus();
  });

  it("closes and returns focus to the trigger on Escape", async () => {
    const onToggle = vi.fn();
    render(<CategoryAccordion category={upper} isOpen onToggle={onToggle} />);
    const trigger = screen.getByRole("button", { name: /prendas superiores/i });
    screen.getByText("Flow Line Tee").closest("button")!.focus();
    await userEvent.keyboard("{Escape}");
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });
});
