import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyCatalogState } from "./EmptyCatalogState";

describe("EmptyCatalogState", () => {
  it("shows the default message", () => {
    render(<EmptyCatalogState />);
    expect(screen.getByText(/todavía no hay prendas/i)).toBeInTheDocument();
  });

  it("shows a custom message when given one", () => {
    render(<EmptyCatalogState message="Sin accesorios por ahora." />);
    expect(screen.getByText("Sin accesorios por ahora.")).toBeInTheDocument();
  });
});
