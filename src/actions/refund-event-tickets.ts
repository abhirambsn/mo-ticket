"use server";

import { getConvexClient } from "@/lib/convex";
import { stripe } from "@/lib/stripe";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { TICKET_STATUS } from "@convex/constants";

export async function refundEventTickets(eventId: Id<"events">) {
  const convex = getConvexClient();

  const event = await convex.query(api.events.getById, { eventId });
  if (!event) {
    throw new Error("Event not found");
  }

  const stripeConnectId = await convex.query(
    api.users.getUsersStripeConnectId,
    {
      userId: event.userId,
    }
  );

  if (!stripeConnectId) {
    throw new Error("User has no stripe account");
  }

  const tickets = await convex.query(api.tickets.getValidTicketsForEvent, {
    eventId,
  });

  const results = await Promise.allSettled(
    tickets.map(async (ticket) => {
      try {
        if (!ticket.paymentIntentId) {
          throw new Error("Payment information not found");
        }

        await stripe.refunds.create(
          {
            payment_intent: ticket.paymentIntentId,
            reason: "requested_by_customer",
          },
          {
            stripeAccount: stripeConnectId,
          }
        );

        await convex.mutation(api.tickets.updateTicketStatus, {
          ticketId: ticket._id,
          status: TICKET_STATUS.REFUNDED,
        });

        return { success: true, ticketId: ticket._id };
      } catch (error) {
        console.error(`Failed to refund ticket id: ${ticket._id}:`, error);
        return { success: false, ticketId: ticket._id, error };
      }
    })
  );

  const allSuccessful = results.every(
    (result) => result.status === "fulfilled" && result.value.success
  );

  if (!allSuccessful) {
    throw new Error(
      "Some tickets failed to refund. Please check the logs for more information."
    );
  }

  await convex.mutation(api.events.cancelEvent, { eventId });

  return { success: true };
}
