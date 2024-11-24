import { StripeCheckoutMetadata } from "@/actions/create-stripe-checkout-session";
import { getConvexClient } from "@/lib/convex";
import { stripe } from "@/lib/stripe";
import { api } from "@convex/_generated/api";
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(req: Request) {
  console.log("Webhook received");

  const body = await req.text();
  const headersList = await headers();
  const stripeSignature = headersList.get("stripe-signature") as string;

  console.log("Webhook signature", stripeSignature ? "present" : "missing");

  let event: Stripe.Event;

  try {
    console.log("Constructing event");
    event = stripe.webhooks.constructEvent(
      body,
      stripeSignature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log("Event constructed", event.type);
  } catch (error) {
    console.error("Error constructing event", error);
    return new Response(`Webhook Error: ${(error as Error).message}`, {
      status: 400,
    });
  }

  const convex = getConvexClient();

  if (event.type === "checkout.session.completed") {
    console.log("Processing checkout.session.completed event");
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata as StripeCheckoutMetadata;
    console.log("Session metadata", metadata);
    console.log("convex client", convex);

    try {
      const result = await convex.mutation(api.events.purchaseTicket, {
        eventId: metadata.eventId,
        userId: metadata.userId,
        waitingListId: metadata.waitingListId,
        paymentInfo: {
          paymentIntentId: session.payment_intent as string,
          amount: session.amount_total ?? 0,
        },
      });
      console.log("Purchase ticket mutation complete", result);
    } catch (error) {
      console.error("Error processing checkout.session.completed event", error);
      return new Response("Error processing checkout.session.completed event", {
        status: 500,
      });
    }
  }

  return new Response(null, { status: 200 });
}
