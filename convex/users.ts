import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUserById = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    return user;
  },
});

export const updateUser = mutation({
  args: {
    userId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { userId, firstName, lastName, email }) => {
    const userExists = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (userExists) {
      await ctx.db.patch(userExists._id, {
        firstName,
        lastName,
        email,
      });
      return userExists._id;
    }

    const newUserId = await ctx.db.insert("users", {
      userId,
      firstName,
      lastName,
      email,
      stripeConnectId: undefined,
    });

    return newUserId;
  },
});

export const getUsersStripeConnectId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), userId))
      .filter((q) => q.neq(q.field("stripeConnectId"), undefined))
      .first();
    return user?.stripeConnectId;
  },
});

export const updateOrCreateStripeUserConnectId = mutation({
  args: {
    userId: v.string(),
    stripeConnectId: v.string(),
  },
  handler: async (ctx, { userId, stripeConnectId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { stripeConnectId });
  },
});
