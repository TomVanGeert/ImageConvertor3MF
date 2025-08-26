import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth-options";
import { prisma } from "../../lib/prisma";
import { CartItem } from "../../lib/types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export async function POST(req: Request) {
  try {
    // --- Get logged-in user ---
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // --- Parse cart items ---
    const { items }: { items: CartItem[] } = await req.json();
    if (!items || !items.length) return NextResponse.json({ error: "Cart empty" }, { status: 400 });

    // --- Calculate total ---
    const totalAmountCents = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // --- Create Stripe checkout session ---
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((i) => ({
        price_data: {
          currency: "eur",
          product_data: { name: i.name }, // ✅ no images
          unit_amount: i.price,
        },
        quantity: i.quantity,
      })),
      success_url: `${req.headers.get("origin")}/success`,
      cancel_url: `${req.headers.get("origin")}/cart`,
    });

    // --- Save order in Prisma ---
    await prisma.order.create({
      data: {
        id: stripeSession.id,
        userId,
        total: totalAmountCents / 100,
        status: "PENDING",
        items: items.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
