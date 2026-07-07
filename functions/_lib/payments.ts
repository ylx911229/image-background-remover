import { PLANS, type PlanId } from "./plans";

export type PaymentEnv = {
  DB: D1Database;
};

export async function grantCreditsForPayment(
  env: PaymentEnv,
  payment: {
    id: string;
    userId: string;
    planId: PlanId;
  },
  rawResponse: unknown,
) {
  const existingGrant = await env.DB.prepare(
    "SELECT id FROM credit_grants WHERE source_payment_id = ? LIMIT 1",
  )
    .bind(payment.id)
    .first<{ id: string }>();

  if (existingGrant) {
    await env.DB.prepare(
      `UPDATE payment_orders
      SET status = 'COMPLETED', captured_at = COALESCE(captured_at, ?), raw_response = ?
      WHERE id = ?`,
    )
      .bind(new Date().toISOString(), JSON.stringify(rawResponse), payment.id)
      .run();

    return false;
  }

  const plan = PLANS[payment.planId];

  if (!plan || plan.id === "free") {
    throw new Error("Unknown payment plan.");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE payment_orders
      SET status = 'COMPLETED', captured_at = ?, raw_response = ?
      WHERE id = ?`,
    ).bind(now.toISOString(), JSON.stringify(rawResponse), payment.id),
    env.DB.prepare(
      `INSERT INTO credit_grants (
        id,
        user_id,
        source_payment_id,
        plan_id,
        total_credits,
        remaining_credits,
        starts_at,
        expires_at,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      payment.userId,
      payment.id,
      plan.id,
      plan.credits,
      plan.credits,
      now.toISOString(),
      expiresAt.toISOString(),
      now.toISOString(),
    ),
    env.DB.prepare(
      `INSERT INTO credit_events (id, user_id, event_type, delta, created_at)
      VALUES (?, ?, 'purchase_grant', ?, ?)`,
    ).bind(crypto.randomUUID(), payment.userId, plan.credits, now.toISOString()),
  ]);

  return true;
}
