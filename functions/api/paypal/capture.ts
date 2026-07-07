import { getSessionUser, jsonError, type AuthEnv } from "../../_lib/auth";
import { PLANS } from "../../_lib/plans";
import { capturePayPalOrder, type PayPalEnv } from "../../_lib/paypal";

type Env = AuthEnv & PayPalEnv;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const requestUrl = new URL(request.url);
  const orderId = requestUrl.searchParams.get("token");

  if (!orderId) {
    return Response.redirect(`${requestUrl.origin}/pricing?payment=missing`, 303);
  }

  const session = await getSessionUser(request, env);

  if (!session) {
    const redirect = encodeURIComponent(`/api/paypal/capture?token=${orderId}`);
    return Response.redirect(
      `${requestUrl.origin}/api/auth/google/start?redirect=${redirect}`,
      303,
    );
  }

  const payment = await env.DB.prepare(
    `SELECT id, user_id AS userId, plan_id AS planId, status
    FROM payment_orders
    WHERE provider = 'paypal' AND provider_order_id = ?
    LIMIT 1`,
  )
    .bind(orderId)
    .first<{
      id: string;
      userId: string;
      planId: keyof typeof PLANS;
      status: string;
    }>();

  if (!payment || payment.userId !== session.user.id) {
    return Response.redirect(`${requestUrl.origin}/pricing?payment=unknown`, 303);
  }

  if (payment.status === "COMPLETED") {
    return Response.redirect(`${requestUrl.origin}/pricing?payment=success`, 303);
  }

  const plan = PLANS[payment.planId];

  if (!plan || plan.id === "free") {
    return jsonError("Unknown payment plan.", 400);
  }

  try {
    const capture = await capturePayPalOrder(env, orderId);

    if (capture.status !== "COMPLETED") {
      await env.DB.prepare(
        "UPDATE payment_orders SET status = ?, raw_response = ? WHERE id = ?",
      )
        .bind(capture.status, JSON.stringify(capture), payment.id)
        .run();

      return Response.redirect(`${requestUrl.origin}/pricing?payment=pending`, 303);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await env.DB.batch([
      env.DB.prepare(
        `UPDATE payment_orders
        SET status = 'COMPLETED', captured_at = ?, raw_response = ?
        WHERE id = ?`,
      ).bind(now.toISOString(), JSON.stringify(capture), payment.id),
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
        session.user.id,
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
      ).bind(crypto.randomUUID(), session.user.id, plan.credits, now.toISOString()),
    ]);

    return Response.redirect(`${requestUrl.origin}/pricing?payment=success`, 303);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Could not capture PayPal payment.",
      502,
    );
  }
};

export const onRequest: PagesFunction<Env> = () =>
  jsonError("Method not allowed.", 405);
