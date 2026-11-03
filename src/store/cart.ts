import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  productId: string;
  name: string;
  priceCOP: number;
  size: string;
  colorId: string;
  colorName: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (line: Omit<CartLine, "quantity">, quantity: number) => void;
  removeLine: (productId: string, size: string, colorId: string) => void;
  setQuantity: (productId: string, size: string, colorId: string, quantity: number) => void;
  clear: () => void;
}

function sameLine(a: CartLine, productId: string, size: string, colorId: string) {
  return a.productId === productId && a.size === size && a.colorId === colorId;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      addItem: (line, quantity) =>
        set((state) => {
          const existing = state.lines.find((l) => sameLine(l, line.productId, line.size, line.colorId));
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                sameLine(l, line.productId, line.size, line.colorId)
                  ? { ...l, quantity: l.quantity + quantity }
                  : l,
              ),
              isOpen: true,
            };
          }
          return { lines: [...state.lines, { ...line, quantity }], isOpen: true };
        }),
      removeLine: (productId, size, colorId) =>
        set((state) => ({ lines: state.lines.filter((l) => !sameLine(l, productId, size, colorId)) })),
      setQuantity: (productId, size, colorId, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((l) => (sameLine(l, productId, size, colorId) ? { ...l, quantity } : l))
            .filter((l) => l.quantity > 0),
        })),
      clear: () => set({ lines: [] }),
    }),
    { name: "forty-five-cart" },
  ),
);

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.priceCOP * l.quantity, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}
