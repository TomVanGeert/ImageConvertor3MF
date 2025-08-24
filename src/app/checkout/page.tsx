'use client';

import React from "react";
import { useCart } from "../hooks/useCart";

export default function CartPage() {
  const { items, removeItem, clear, total } = useCart();

  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items, // use the items from hook
          customerName: "John Doe",
          customerEmail: "john@example.com",
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout failed");
      }
    } catch (err) {
      console.error(err);
      alert("Checkout failed");
    }
  };

  if (items.length === 0)
    return (
      <div className="text-center mt-10">
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Shopping Cart</h1>
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between bg-white p-4 rounded shadow"
          >
            <div className="flex items-center gap-4">
              {item.previewUrl && (
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-gray-600">
                  €{(item.price / 100).toFixed(2)} x {item.quantity}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="text-red-600 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex justify-between items-center mt-6">
        <p className="text-xl font-bold">
          Total: €{(total() / 100).toFixed(2)}
        </p>
        <div className="flex gap-3">
          <button
            onClick={clear}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
          >
            Clear Cart
          </button>
          <button
            onClick={handleCheckout}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
