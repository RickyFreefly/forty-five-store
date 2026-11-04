import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { useProductFocusStore } from "./store/productFocus";

// jsdom doesn't implement these browser APIs. Legacy sections mounted deep in the
// real App tree (El Ropero's engine, BrandPhilosophy's whileInView) rely on them
// unconditionally; stub them here so the real tree can mount end-to-end in tests.
// This is environment plumbing only — unrelated to the catalog → product focus
// behavior under test.
beforeEach(() => {
  useProductFocusStore.setState({ product: null });

  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );

  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  }
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

describe("App catalog → product focus integration", () => {
  it("opens ProductFocusView when a real product card in Prendas Superiores is clicked", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /prendas superiores/i }));
    await userEvent.click(screen.getByRole("button", { name: /flow line tee/i }));
    expect(useProductFocusStore.getState().product?.id).toBe("flow-line-tee");
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/flow line tee/i)).toBeInTheDocument();
  });
});
