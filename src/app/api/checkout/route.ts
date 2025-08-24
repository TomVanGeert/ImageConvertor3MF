import { NextResponse } from "next/server";
import Stripe from "stripe";
import fs from "fs";
import path from "path";
import { CartItem } from "../../lib/types";
import { cookies } from "next/headers";
import { getUserId } from "../auth/sessions/route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-07-30.basil" });

const ordersFile = path.join(process.cwd(), "data", "orders.json");

// Ensure orders.json exists
if (!fs.existsSync(ordersFile)) fs.writeFileSync(ordersFile, JSON.stringify([]));

export async function POST(req: Request) {
  try {
    // ✅ Await cookies before using get()
    const cookieStore = await cookies();
    const token = cookieStore.get("sessionToken")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = getUserId(token);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get cart items from request
    const { items }: { items: CartItem[] } = await req.json();
    if (!items || !items.length) return NextResponse.json({ error: "Cart empty" }, { status: 400 });

    // ✅ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((i) => ({
        price_data: {
          currency: "eur",
          product_data: { name: i.name },
          unit_amount: i.price, // in cents
        },
        quantity: i.quantity,
      })),
      success_url: `${req.headers.get("origin")}/success`,
      cancel_url: `${req.headers.get("origin")}/cart`,
    });

    // Read existing orders safely
    let orders: any[] = [];
    try {
      const raw = fs.readFileSync(ordersFile, "utf8");
      orders = raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn("Could not read orders.json, starting fresh.", err);
    }

    // Save new order
    const newOrder = {
      id: session.id,
      userId,
      cartItems: items,
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      createdAt: new Date().toISOString(),
    };

    orders.push(newOrder);
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
