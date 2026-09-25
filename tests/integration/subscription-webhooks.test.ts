import { afterEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { prisma, cleanupUser } from "@/tests/integration/helpers/db";

// The checkout.session.completed handler calls stripe.subscriptions.retrieve()
// to fetch full subscription details. Mocked here (rather than hitting the
// real Stripe test-mode API) so this suite has no network dependency and
// runs in CI, which has no STRIPE_SECRET_KEY configured. The live end-to-end
// path (real Stripe test-mode objects + signed webhook delivery) was
// verified manually against a running dev server during development.
const retrieveMock = vi.fn();
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ subscriptions: { retrieve: retrieveMock } }),
}));

const { handleStripeWebhookEvent } = await import("@/server/services/subscription.service");

let userId: string | null = null;

afterEach(async () => {
  if (userId) await cleanupUser(userId);
  userId = null;
  retrieveMock.mockReset();
});

async function makeUser() {
  const user = await prisma.user.create({
    data: {
      email: `test-stripe-${Date.now()}@example.test`,
      passwordHash: "irrelevant",
      subscription: { create: { plan: "FREE", status: "ACTIVE" } },
    },
  });
  userId = user.id;
  return user;
}

function fakeStripeSubscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: "sub_test123",
    object: "subscription",
    customer: "cus_test123",
    status: "active",
    items: {
      object: "list",
      data: [{ current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 }],
    },
    ...overrides,
  } as Stripe.Subscription;
}

describe("handleStripeWebhookEvent (real DB, mocked Stripe API)", () => {
  it("checkout.session.completed upgrades the user to Pro and links Stripe ids", async () => {
    const user = await makeUser();
    retrieveMock.mockResolvedValue(fakeStripeSubscription({ customer: "cus_abc" }));

    await handleStripeWebhookEvent({
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: user.id,
          customer: "cus_abc",
          subscription: "sub_test123",
        },
      },
    } as unknown as Stripe.Event);

    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    expect(subscription?.plan).toBe("PRO");
    expect(subscription?.status).toBe("ACTIVE");
    expect(subscription?.provider).toBe("stripe");
    expect(subscription?.providerCustomerId).toBe("cus_abc");
    expect(subscription?.providerSubscriptionId).toBe("sub_test123");
    expect(subscription?.currentPeriodEnd).not.toBeNull();
  });

  it("ignores checkout.session.completed with no client_reference_id or subscription", async () => {
    const user = await makeUser();

    await handleStripeWebhookEvent({
      type: "checkout.session.completed",
      data: { object: { client_reference_id: null, customer: "cus_abc", subscription: null } },
    } as unknown as Stripe.Event);

    expect(retrieveMock).not.toHaveBeenCalled();
    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    expect(subscription?.plan).toBe("FREE");
  });

  it("customer.subscription.updated syncs status for an already-linked customer", async () => {
    const user = await makeUser();
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { provider: "stripe", providerCustomerId: "cus_linked", providerSubscriptionId: "sub_1" },
    });

    await handleStripeWebhookEvent({
      type: "customer.subscription.updated",
      data: {
        object: fakeStripeSubscription({ customer: "cus_linked", status: "past_due" }),
      },
    } as unknown as Stripe.Event);

    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    expect(subscription?.status).toBe("PAST_DUE");
    expect(subscription?.plan).toBe("PRO"); // past_due keeps Pro access during Stripe's own retry window
  });

  it("customer.subscription.updated is a no-op for an unrecognized customer", async () => {
    const user = await makeUser();

    await handleStripeWebhookEvent({
      type: "customer.subscription.updated",
      data: { object: fakeStripeSubscription({ customer: "cus_unknown" }) },
    } as unknown as Stripe.Event);

    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    expect(subscription?.plan).toBe("FREE");
    expect(subscription?.providerCustomerId).toBeNull();
  });

  it("customer.subscription.deleted downgrades the user back to Free", async () => {
    const user = await makeUser();
    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        plan: "PRO",
        status: "ACTIVE",
        provider: "stripe",
        providerCustomerId: "cus_cancel_me",
        providerSubscriptionId: "sub_1",
      },
    });

    await handleStripeWebhookEvent({
      type: "customer.subscription.deleted",
      data: { object: fakeStripeSubscription({ customer: "cus_cancel_me", status: "canceled" }) },
    } as unknown as Stripe.Event);

    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    expect(subscription?.plan).toBe("FREE");
    expect(subscription?.status).toBe("CANCELED");
  });

  it("ignores unhandled event types", async () => {
    const user = await makeUser();

    await expect(
      handleStripeWebhookEvent({ type: "invoice.paid", data: { object: {} } } as unknown as Stripe.Event),
    ).resolves.toBeUndefined();

    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    expect(subscription?.plan).toBe("FREE");
  });
});
