import Stripe from "stripe";
import { POST as saveOrder } from "../route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

function isStripeProduct(
  product: string | Stripe.Product | Stripe.DeletedProduct
): product is Stripe.Product {
  return typeof product !== "string" && !("deleted" in product);
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // 🔑 Fetch line items with expanded product info
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
      expand: ["data.price.product"],
    });

    const cartItems = lineItems.data.map((item) => {
      let imageUrl = "";

      // Ensure product is fully expanded
      if (item.price?.product && isStripeProduct(item.price.product)) {
        imageUrl = item.price.product.images?.[0] || "";
      }

      return {
        imageUrl,
        material: "PLA",
        size: "medium",
        quantity: item.quantity || 1,
        price: (item.price?.unit_amount || 0) / 100,
      };
    });

    // ✅ Customer info is in session.customer_details
    const shipping = (session as any).shipping?.address || {};

    const order = {
      id: session.id,
      customer: {
        name: session.customer_details?.name || "Unknown",
        email: session.customer_details?.email || "N/A",
        address: shipping,
      },
      cartItems,
      total: session.amount_total! / 100,
      createdAt: new Date().toISOString(),
    };

    // Save the order into orders.json
    await saveOrder(
      new Request(`${process.env.NEXT_PUBLIC_BASE_URL}`, {
        method: "POST",
        body: JSON.stringify(order),
      })
    );
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
