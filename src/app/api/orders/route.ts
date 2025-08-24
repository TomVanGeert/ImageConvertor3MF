import { NextResponse } from "next/server";
import Stripe from "stripe";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

const ordersFile = path.join(process.cwd(), "data", "orders.json");

// Ensure data folder + file exist
if (!fs.existsSync(path.dirname(ordersFile))) {
  fs.mkdirSync(path.dirname(ordersFile), { recursive: true });
}
if (!fs.existsSync(ordersFile)) {
  fs.writeFileSync(ordersFile, JSON.stringify([]));
}

export async function POST(req: Request) {
  try {
    const { items, customerName, customerEmail } = await req.json();

    if (!items?.length || !customerName || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Calculate total
    const total = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

    // Create order object
    const newOrder = {
      id: uuidv4(),
      total,
      createdAt: new Date().toISOString(),
      customer: { name: customerName, email: customerEmail },
      cartItems: items,
    };

    // Save order to JSON
    const orders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
    orders.push(newOrder);
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((i: any) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: i.name,
            images: i.imageUrl ? [i.imageUrl] : [],
          },
          unit_amount: Math.round(i.price * 100),
        },
        quantity: i.quantity,
      })),
      success_url: `${req.headers.get("origin")}/success`,
      cancel_url: `${req.headers.get("origin")}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
