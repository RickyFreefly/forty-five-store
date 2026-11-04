import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CatalogMenu } from "./CatalogMenu";

describe("CatalogMenu", () => {
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
});
