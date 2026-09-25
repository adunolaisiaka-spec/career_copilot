import Stripe from "stripe";

let cached: Stripe | null = null;

/** Server-only. Throws if STRIPE_SECRET_KEY isn't configured — callers should
 * only reach this once payments are actually being wired up (checkout,
 * portal, webhook routes), not on every request. */
export function getStripe(): Stripe {
  if (cached) return cached;

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not set — payments are not configured.");
  }

  cached = new Stripe(apiKey);
  return cached;
}
