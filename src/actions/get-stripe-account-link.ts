"use server";

import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";

export async function getStripeAccountLink(accountId: string) {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin") || "";

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/connect/refresh/${accountId}`,
      return_url: `${origin}/connect/return/${accountId}`,
      type: "account_onboarding",
    });

    return { url: accountLink.url };
  } catch (error) {
    console.error("Error creating account link", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Unknown error");
  }
}
