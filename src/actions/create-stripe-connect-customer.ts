"use server";

import { stripe } from "@/lib/stripe";
import { auth } from "@clerk/nextjs/server";
import { api } from "@convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function createStripeConnectCustomer() {
    const {userId} = await auth();

    if (!userId) {
        throw new Error("Not authenticated");
    }

    const existingStripeConnectId = await convex.query(
        api.users.getUsersStripeConnectId,
        {
            userId
        }
    )

    if (existingStripeConnectId) {
        return { account: existingStripeConnectId };
    }

    const account = await stripe.accounts.create({
        type: "express",
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
            amazon_pay_payments: { requested: true }
        }
    });

    await convex.mutation(api.users.updateOrCreateStripeUserConnectId, {
        userId,
        stripeConnectId: account.id
    });

    return { account: account.id };
}