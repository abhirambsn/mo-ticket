import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { DURATIONS, TICKET_STATUS, WAITING_LIST_STATUS } from "./constants";
import { internal } from "./_generated/api";
import { processQueue } from "./waitingList";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("isCancelled"), undefined))
      .collect();
  },
});

export const getById = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, { eventId }) => {
    return await ctx.db.get(eventId);
  },
});

export const getEventAvailability = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found");

    const purchasedCount = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect()
      .then(
        (tickets) =>
          tickets.filter(
            (t) =>
              t.status === TICKET_STATUS.VALID ||
              t.status === TICKET_STATUS.USED
          ).length
      );

    const now = Date.now();
    const activeOffers = await ctx.db
      .query("waitingList")
      .withIndex("by_event_status", (q) =>
        q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.OFFERED)
      )
      .collect()
      .then(
        (entries) => entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length
      );
    const totalReserved = purchasedCount + activeOffers;

    return {
      isSoldOut: totalReserved >= event.totalTickets,
      totalTickets: event.totalTickets,
      purchasedCount,
      activeOffers,
      remainingTickets: Math.max(0, event.totalTickets - totalReserved),
    };
  },
});

export const checkAvailability = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found");

    const purchasedCount = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect()
      .then(
        (tickets) =>
          tickets.filter(
            (t) =>
              t.status === TICKET_STATUS.VALID ||
              t.status === TICKET_STATUS.USED
          ).length
      );

    const now = Date.now();
    const activeOffers = await ctx.db
      .query("waitingList")
      .withIndex("by_event_status", (q) =>
        q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.OFFERED)
      )
      .collect()
      .then(
        (entries) => entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length
      );

    const availableSpots = event.totalTickets - (purchasedCount + activeOffers);

    return {
      available: availableSpots > 0,
      availableSpots,
      totalTickets: event.totalTickets,
      purchasedCount,
      activeOffers,
    };
  },
});

export const joinWaitingList = mutation({
  args: { eventId: v.id("events"), userId: v.string() },
  handler: async (ctx, { eventId, userId }) => {
    const exisitingEntry = await ctx.db
      .query("waitingList")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .filter((q) => q.neq(q.field("status"), WAITING_LIST_STATUS.EXPIRED))
      .first();

    if (exisitingEntry) {
      throw new Error("Already in the waiting list");
    }

    const { available } = await checkAvailability(ctx, { eventId });

    const now = Date.now();

    if (available) {
      const waitingListId = await ctx.db.insert("waitingList", {
        eventId,
        userId,
        status: WAITING_LIST_STATUS.OFFERED,
        offerExpiresAt: now + DURATIONS.TICKET_OFFER,
      });

      await ctx.scheduler.runAfter(
        DURATIONS.TICKET_OFFER,
        internal.waitingList.expireOffer,
        {
          waitingListId,
          eventId,
        }
      );
    } else {
      await ctx.db.insert("waitingList", {
        eventId,
        userId,
        status: WAITING_LIST_STATUS.WAITING,
        offerExpiresAt: 0,
      });
    }

    return {
      success: true,
      status: available
        ? WAITING_LIST_STATUS.OFFERED
        : WAITING_LIST_STATUS.WAITING,
      message: available
        ? `Ticket offered - you have ${DURATIONS.TICKET_OFFER / (60 * 1000)} minutes to purchase`
        : "Added to Waiting List - you will be notified when a ticket is available",
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    location: v.string(),
    price: v.number(),
    totalTickets: v.number(),
    eventDate: v.number(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("events", {
      name: args.name,
      description: args.description,
      location: args.location,
      price: args.price,
      totalTickets: args.totalTickets,
      eventDate: args.eventDate,
      userId: args.userId,
    });

    return eventId;
  },
});

export const update = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    description: v.string(),
    location: v.string(),
    price: v.number(),
    totalTickets: v.number(),
    eventDate: v.number(),
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args;

    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found");

    const soldTickets = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .filter((q) =>
        q.or(
          q.eq("status", TICKET_STATUS.VALID),
          q.eq("status", TICKET_STATUS.USED)
        )
      )
      .collect();

    if (updates.totalTickets < soldTickets.length) {
      throw new Error(
        `Cannot reduce total tickets below the number of tickets already sold (${soldTickets.length})`
      );
    }

    await ctx.db.patch(eventId, updates);
    return eventId;
  },
});

export const purchaseTicket = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
    waitingListId: v.id("waitingList"),
    paymentInfo: v.object({
      paymentIntentId: v.string(),
      amount: v.number(),
    }),
  },
  handler: async (ctx, { eventId, userId, waitingListId, paymentInfo }) => {
    const waitingListEntry = await ctx.db.get(waitingListId);
    if (!waitingListEntry) {
      throw new Error("Waiting list entry not found");
    }

    if (waitingListEntry.status !== WAITING_LIST_STATUS.OFFERED) {
      throw new Error("Ticket not offered");
    }

    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    try {
      await ctx.db.insert("tickets", {
        eventId,
        userId,
        purchasedOn: Date.now(),
        status: TICKET_STATUS.VALID,
        paymentIntentId: paymentInfo.paymentIntentId,
        amount: paymentInfo.amount,
      });

      await ctx.db.patch(waitingListId, {
        status: WAITING_LIST_STATUS.PURCHASED,
      });

      await processQueue(ctx, { eventId });
    } catch (error) {
      throw new Error(`Error purchasing ticket, ${error}`);
    }
  },
});

export const getUserTickets = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const ticketsWithEvents = await Promise.all(
      tickets.map(async (ticket) => {
        const event = await ctx.db.get(ticket.eventId);
        return {
          ...ticket,
          event,
        };
      })
    );
    return ticketsWithEvents;
  },
});
