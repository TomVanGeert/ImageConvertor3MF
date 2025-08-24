// src/app/hooks/useCart.ts
"use client";

import { create } from "zustand";
import { CartItem } from "../lib/types";

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  total: () => number;
};

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      // merge if same id already exists
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [] }),
  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));
