import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { TICKET_STATUS } from "./constants";

export const getUserTicketForEvent = query({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
  },
  handler: async (ctx, { userId, eventId }) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .first();

    return ticket;
  },
});

export const getTicketWithDetails = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) return null;

    const event = await ctx.db.get(ticket.eventId);

    return {
      ...ticket,
      event,
    };
  },
});

export const getValidTicketsForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), TICKET_STATUS.VALID),
          q.eq(q.field("status"), TICKET_STATUS.USED)
        )
      )
      .collect();

    return tickets;
  },
});

export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: v.union(
      v.literal(TICKET_STATUS.VALID),
      v.literal(TICKET_STATUS.USED),
      v.literal(TICKET_STATUS.REFUNDED),
      v.literal(TICKET_STATUS.CANCELLED)
    ),
  },
  handler: async (ctx, { ticketId, status }) => {
    await ctx.db.patch(ticketId, { status });
    return ticketId;
  },
});
