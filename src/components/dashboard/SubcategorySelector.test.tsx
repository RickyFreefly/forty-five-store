import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubcategorySelector } from "./SubcategorySelector";

const options = [
  { id: "hibridos", label: "Híbridos", slots: 4 },
  { id: "skydiving", label: "Skydiving", slots: 2 },
];

describe("SubcategorySelector", () => {
  it("renders a button per option", () => {
    render(<SubcategorySelector options={options} value="hibridos" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Híbridos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skydiving" })).toBeInTheDocument();
  });

  it("marks the active option with aria-pressed", () => {
    render(<SubcategorySelector options={options} value="skydiving" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Skydiving" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Híbridos" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the clicked option's id", async () => {
    const onChange = vi.fn();
    render(<SubcategorySelector options={options} value="hibridos" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Skydiving" }));
    expect(onChange).toHaveBeenCalledWith("skydiving");
  });
});
