import fs from "fs";
import path from "path";

interface Order {
  id: string;
  total: number;
  createdAt: string;
  customer: {
    name: string;
    email: string;
  };
  cartItems: {
    name: string;
    price: number;
    quantity: number;
    previewUrl?: string;
  }[];
}

export default function SuccessPage() {
  const ordersFile = path.join(process.cwd(), "data", "orders.json");

  // Read orders.json
  let orders: Order[] = [];
  try {
    const data = fs.readFileSync(ordersFile, "utf8");
    orders = JSON.parse(data);
  } catch (err) {
    console.error("Failed to read orders.json:", err);
  }

  const order = orders.length > 0 ? orders[orders.length - 1] : null;

  if (!order) {
    return <p className="p-6 text-lg">No recent order found.</p>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold text-green-600 mb-6">✅ Order Confirmed!</h1>
      <p className="text-gray-700 mb-4">
        Thank you, <span className="font-semibold">{order.customer?.name}</span>!
      </p>
      <p className="text-gray-700 mb-6">
        We’ve received your order placed on{" "}
        <span className="font-semibold">
          {new Date(order.createdAt).toLocaleString()}
        </span>
        .
      </p>

      <div className="space-y-4">
        {order.cartItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border rounded-lg p-4 bg-gray-50"
          >
            {item.previewUrl ? (
              <img
                src={item.previewUrl}
                alt={item.name}
                className="w-20 h-20 object-contain rounded"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm">
                No Image
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-gray-500">
                Quantity: {item.quantity}
              </p>
              <p className="text-sm text-gray-800">
                €{(item.price / 100).toFixed(2)} each
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t pt-4 flex justify-between text-lg font-semibold">
        <span>Total:</span>
        <span>€{(order.total / 100).toFixed(2)}</span>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-700">
          A confirmation email has been sent to{" "}
          <span className="font-semibold">{order.customer?.email}</span>.
        </p>
      </div>
    </div>
  );
}
