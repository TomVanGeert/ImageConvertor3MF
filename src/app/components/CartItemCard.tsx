// src/app/components/CartItemCard.tsx
"use client";

import { CartItem } from "../lib/types";
import { useCart } from "../hooks/useCart";

export default function CartItemCard({ item }: { item: CartItem }) {
  const { removeItem } = useCart();

  return (
    <div className="flex items-center justify-between border rounded p-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <img
          src={item.previewUrl}
          alt={item.name}
          className="w-16 h-16 object-cover rounded"
        />
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-gray-600">€{item.price.toFixed(2)}</p>
        </div>
      </div>
      <button
        onClick={() => removeItem(item.id)}
        className="text-red-600 hover:underline"
      >
        Remove
      </button>
    </div>
  );
}
