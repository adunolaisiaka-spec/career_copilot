import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { handleStripeWebhookEvent } from "@/server/services/subscription.service";

/**
 * No auth here — Stripe calls this directly, authenticated instead by
 * verifying the request is genuinely signed by Stripe (constructEvent below).
 * Needs the raw body (request.text(), not request.json()) since the
 * signature is computed over the exact bytes Stripe sent.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  await handleStripeWebhookEvent(event);
  return NextResponse.json({ received: true });
}
