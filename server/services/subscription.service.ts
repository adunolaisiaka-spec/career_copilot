import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { PLAN_LIMITS, type LimitedResource, type Plan } from "@/lib/subscriptions/plans";
import * as repo from "@/server/repositories/subscription.repository";
import { prisma } from "@/lib/database/prisma";

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const subscription = await repo.findSubscriptionByUserId(userId);
  return subscription?.plan ?? "FREE";
}

async function getCurrentUsage(userId: string) {
  const [applications, savedJobs, resumeAnalysesThisMonth] = await Promise.all([
    repo.countApplications(userId),
    repo.countSavedJobs(userId),
    repo.countResumeAnalysesSince(userId, startOfMonth()),
  ]);
  return {
    maxApplications: applications,
    maxSavedJobs: savedJobs,
    maxResumeAnalysesPerMonth: resumeAnalysesThisMonth,
  };
}

export async function getUsageSummary(userId: string) {
  const subscription = await repo.findSubscriptionByUserId(userId);
  const plan: Plan = subscription?.plan ?? "FREE";
  const limits = PLAN_LIMITS[plan];
  const usage = await getCurrentUsage(userId);

  return {
    plan,
    status: subscription?.status ?? "ACTIVE",
    applications: { used: usage.maxApplications, limit: limits.maxApplications },
    savedJobs: { used: usage.maxSavedJobs, limit: limits.maxSavedJobs },
    resumeAnalysesThisMonth: {
      used: usage.maxResumeAnalysesPerMonth,
      limit: limits.maxResumeAnalysesPerMonth,
    },
  };
}

/**
 * Central place every feature service calls before creating a limited resource —
 * never hard-code plan checks in application/job/resume services directly.
 * Throws a user-facing error when the caller's plan limit would be exceeded.
 */
export async function assertWithinLimit(userId: string, resource: LimitedResource) {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan][resource];
  if (limit === Infinity) return;

  const usage = await getCurrentUsage(userId);
  const used = usage[resource];

  if (used >= limit) {
    const labels: Record<LimitedResource, string> = {
      maxApplications: "tracked applications",
      maxSavedJobs: "saved jobs",
      maxResumeAnalysesPerMonth: "resume analyses this month",
    };
    throw new Error(
      `You've reached your Free plan limit of ${limit} ${labels[resource]}. Upgrade to Pro for unlimited access.`,
    );
  }
}

/**
 * Creates a Stripe Checkout Session for upgrading to Pro. client_reference_id
 * carries our userId so the checkout.session.completed webhook can link the
 * resulting Stripe customer back to the right row — Stripe subscription
 * events after this point only ever reference the Stripe customer/
 * subscription id, never our own userId, so this is the one place that
 * correlation has to be established.
 */
export async function createCheckoutSession(userId: string, baseUrl: string) {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) throw new Error("STRIPE_PRO_PRICE_ID is not set — payments are not configured.");

  const stripe = getStripe();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const existing = await repo.findSubscriptionByUserId(userId);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: userId,
    customer: existing?.providerCustomerId ?? undefined,
    customer_email: existing?.providerCustomerId ? undefined : user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/settings?checkout=success`,
    cancel_url: `${baseUrl}/settings?checkout=canceled`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

/** Creates a Stripe Billing Portal session for managing/canceling an existing subscription. */
export async function createPortalSession(userId: string, baseUrl: string) {
  const stripe = getStripe();
  const subscription = await repo.findSubscriptionByUserId(userId);
  if (!subscription?.providerCustomerId) {
    throw new Error("No billing account found for this user yet.");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.providerCustomerId,
    return_url: `${baseUrl}/settings`,
  });

  return session.url;
}

function mapStripeStatus(status: Stripe.Subscription.Status): "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    default:
      // past_due, unpaid, incomplete, paused, and any future Stripe status:
      // treat as a payment problem needing attention rather than immediately
      // revoking access — Stripe already retries failed payments on its own
      // schedule before a subscription actually reaches `canceled`.
      return "PAST_DUE";
  }
}

async function syncSubscriptionFromStripe(userId: string, stripeSubscription: Stripe.Subscription) {
  const status = mapStripeStatus(stripeSubscription.status);
  const plan: Plan = status === "CANCELED" ? "FREE" : "PRO";
  const periodEndSeconds = stripeSubscription.items.data[0]?.current_period_end;
  const customerId =
    typeof stripeSubscription.customer === "string"
      ? stripeSubscription.customer
      : stripeSubscription.customer.id;

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      status,
      provider: "stripe",
      providerCustomerId: customerId,
      providerSubscriptionId: stripeSubscription.id,
      currentPeriodEnd: periodEndSeconds ? new Date(periodEndSeconds * 1000) : null,
    },
    update: {
      plan,
      status,
      provider: "stripe",
      providerCustomerId: customerId,
      providerSubscriptionId: stripeSubscription.id,
      currentPeriodEnd: periodEndSeconds ? new Date(periodEndSeconds * 1000) : null,
    },
  });
}

/**
 * Handles the three Stripe webhook events this app cares about. Signature
 * verification happens in the route handler (needs the raw request body,
 * which this service layer shouldn't need to know about) — by the time an
 * event reaches here it's already been verified as genuinely from Stripe.
 */
export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.client_reference_id;
      if (!userId || !session.subscription) return;

      const stripe = getStripe();
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscriptionFromStripe(userId, stripeSubscription);
      return;
    }

    case "customer.subscription.updated": {
      const stripeSubscription = event.data.object;
      const customerId =
        typeof stripeSubscription.customer === "string"
          ? stripeSubscription.customer
          : stripeSubscription.customer.id;
      const existing = await repo.findSubscriptionByProviderCustomerId(customerId);
      if (!existing) return; // not one of ours (or checkout.session.completed hasn't landed yet)
      await syncSubscriptionFromStripe(existing.userId, stripeSubscription);
      return;
    }

    case "customer.subscription.deleted": {
      const stripeSubscription = event.data.object;
      const customerId =
        typeof stripeSubscription.customer === "string"
          ? stripeSubscription.customer
          : stripeSubscription.customer.id;
      await repo.updateSubscriptionByProviderCustomerId(customerId, {
        plan: "FREE",
        status: "CANCELED",
      });
      return;
    }

    default:
      return;
  }
}
