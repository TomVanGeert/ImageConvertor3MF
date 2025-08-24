"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  customer: { name: string; email: string; address: string };
  cartItems: { imageUrl: string; material: string; size: string; quantity: number; price: number }[];
  total: number;
  createdAt: string;
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/orders")
      .then(res => res.json())
      .then(setOrders);
  }, []);

  return (
    <div className="container mx-auto py-16">
      <h1 className="text-3xl font-bold mb-8">Orders Dashboard</h1>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between mb-4">
                <div>
                  <p className="font-semibold text-lg">{order.customer.name}</p>
                  <p>{order.customer.email}</p>
                  <p>{order.customer.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">€{order.total.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {order.cartItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <img src={item.imageUrl} alt="Keychain" className="w-24 h-24 object-cover rounded border" />
                    <p className="mt-2 font-semibold">{item.material} ({item.size})</p>
                    <p>Qty: {item.quantity}</p>
                    <p>€{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
