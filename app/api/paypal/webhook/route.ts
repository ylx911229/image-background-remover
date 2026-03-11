import { NextResponse, NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getSubscription, SUBSCRIPTION_PLANS } from "@/lib/paypal";

export const runtime = "edge";

// Plan ID -> credits per month mapping
const PLAN_CREDITS: Record<string, number> = {
  [process.env.PAYPAL_BASIC_PLAN_ID!]: 25,
  [process.env.PAYPAL_PRO_PLAN_ID!]: 60,
};

const PLAN_NAMES: Record<string, string> = {
  [process.env.PAYPAL_BASIC_PLAN_ID!]: "Basic",
  [process.env.PAYPAL_PRO_PLAN_ID!]: "Pro",
};

async function addCreditsToUser(db: D1Database, userId: string, credits: number) {
  await db.prepare(
    "INSERT OR IGNORE INTO user_credits (user_id, credits) VALUES (?, 0)"
  ).bind(userId).run();

  await db.prepare(
    "UPDATE user_credits SET credits = credits + ?, updated_at = unixepoch() WHERE user_id = ?"
  ).bind(credits, userId).run();
}

export async function POST(req: NextRequest) {
  try {
    // Basic verification: check PayPal headers exist
    const transmissionId = req.headers.get("paypal-transmission-id");
    if (!transmissionId) {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB as D1Database;

    const body = await req.json() as {
      event_type: string;
      resource: any;
    };

    const { event_type, resource } = body;
    console.log("PayPal webhook:", event_type, resource?.id);

    if (event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
      // Subscription activated - add initial credits
      const subscriptionId = resource.id;
      const userId = resource.custom_id; // email set when creating subscription
      const planId = resource.plan_id;

      if (!userId || !planId) {
        console.error("Missing userId or planId in webhook", resource);
        return NextResponse.json({ ok: true });
      }

      const creditsPerMonth = PLAN_CREDITS[planId] || 25;
      const planName = PLAN_NAMES[planId] || "Basic";

      // Save subscription record
      await db.prepare(`
        INSERT OR REPLACE INTO user_subscriptions
          (user_id, paypal_subscription_id, plan_name, credits_per_month, status, updated_at)
        VALUES (?, ?, ?, ?, 'ACTIVE', unixepoch())
      `).bind(userId, subscriptionId, planName, creditsPerMonth).run();

      // Add first month credits
      await addCreditsToUser(db, userId, creditsPerMonth);
      console.log(`Subscription activated: ${userId} +${creditsPerMonth} credits`);
    }

    else if (event_type === "PAYMENT.SALE.COMPLETED") {
      // Monthly renewal payment - add credits again
      const billingAgreementId = resource.billing_agreement_id;
      if (!billingAgreementId) return NextResponse.json({ ok: true });

      // Look up user by subscription ID
      const sub = await db.prepare(
        "SELECT user_id, credits_per_month FROM user_subscriptions WHERE paypal_subscription_id = ? AND status = 'ACTIVE'"
      ).bind(billingAgreementId).first() as { user_id: string; credits_per_month: number } | null;

      if (sub) {
        await addCreditsToUser(db, sub.user_id, sub.credits_per_month);
        console.log(`Monthly renewal: ${sub.user_id} +${sub.credits_per_month} credits`);
      }
    }

    else if (event_type === "BILLING.SUBSCRIPTION.CANCELLED" || event_type === "BILLING.SUBSCRIPTION.EXPIRED") {
      const subscriptionId = resource.id;
      await db.prepare(
        "UPDATE user_subscriptions SET status = 'CANCELLED', updated_at = unixepoch() WHERE paypal_subscription_id = ?"
      ).bind(subscriptionId).run();
      console.log(`Subscription cancelled: ${subscriptionId}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
