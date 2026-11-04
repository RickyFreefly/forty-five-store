import { create } from "zustand";
import type { ClothingProduct } from "../types/product";

interface ProductFocusState {
  product: ClothingProduct | null;
  open: (product: ClothingProduct) => void;
  close: () => void;
}

export const useProductFocusStore = create<ProductFocusState>((set) => ({
  product: null,
  open: (product) => set({ product }),
  close: () => set({ product: null }),
}));
