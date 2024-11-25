"use server";

import baseUrl from "@/lib/baseUrl";
import { getConvexClient } from "@/lib/convex";
import { stripe } from "@/lib/stripe";
import { auth } from "@clerk/nextjs/server";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { DURATIONS } from "@convex/constants";

export type StripeCheckoutMetadata = {
  eventId: Id<"events">;
  userId: string;
  waitingListId: Id<"waitingList">;
};

export async function createStripeCheckoutSession({
  eventId,
}: {
  eventId: Id<"events">;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const convex = getConvexClient();

  const event = await convex.query(api.events.getById, { eventId });
  const queuePosition = await convex.query(api.waitingList.getQueuePosition, {
    eventId,
    userId,
  });
  const stripeConnectId = await convex.query(
    api.users.getUsersStripeConnectId,
    { userId: event?.userId ?? "" }
  );

  if (!stripeConnectId) {
    throw new Error("Stripe Connect ID not found for the owner of the event.");
  }

  if (!queuePosition?.offerExpiresAt) {
    throw new Error("Ticket offer has no expiration date.");
  }

  if (!event) {
    throw new Error("Event not found");
  }

  const metadata: StripeCheckoutMetadata = {
    eventId,
    userId,
    waitingListId: queuePosition._id,
  };

  const session = await stripe.checkout.sessions.create(
    {
      payment_method_types: ["card", "amazon_pay"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: event.name,
              description: event.description,
            },
            unit_amount: Math.round(event.price * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: Math.round(event.price * 100 * 0.1),
      },
      expires_at: Math.floor(Date.now() / 1000) + DURATIONS.TICKET_OFFER / 1000,
      mode: "payment",
      success_url: `${baseUrl}/tickets/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/events/${eventId}`,
      metadata,
    },
    {
      stripeAccount: stripeConnectId,
    }
  );
  return { sessionId: session.id, sessionUrl: session.url };
}
