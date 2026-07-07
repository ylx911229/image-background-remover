import { getSessionUser, jsonError, type AuthEnv } from "../../_lib/auth";
import { getPaidPlan } from "../../_lib/plans";
import { createPayPalOrder, type PayPalEnv } from "../../_lib/paypal";

type Env = AuthEnv & PayPalEnv;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const session = await getSessionUser(request, env);
  const requestUrl = new URL(request.url);

  if (!session) {
    const redirect = encodeURIComponent("/pricing");
    return Response.redirect(
      `${requestUrl.origin}/api/auth/google/start?redirect=${redirect}`,
      303,
    );
  }

  const formData = await request.formData().catch(() => null);
  const plan = getPaidPlan(String(formData?.get("plan") || ""));

  if (!plan) {
    return jsonError("Unknown plan.", 400);
  }

  try {
    const order = await createPayPalOrder(env, plan, requestUrl);
    const approvalUrl = order.links?.find((link) => link.rel === "approve")?.href;

    if (!approvalUrl) {
      return jsonError("PayPal did not return an approval link.", 502);
    }

    await env.DB.prepare(
      `INSERT INTO payment_orders (
        id,
        user_id,
        provider,
        provider_order_id,
        plan_id,
        amount_cents,
        currency,
        status,
        created_at
      )
      VALUES (?, ?, 'paypal', ?, ?, ?, 'USD', ?, ?)`,
    )
      .bind(
        crypto.randomUUID(),
        session.user.id,
        order.id,
        plan.id,
        plan.priceCents,
        order.status,
        new Date().toISOString(),
      )
      .run();

    return Response.redirect(approvalUrl, 303);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Could not start PayPal checkout.",
      502,
    );
  }
};

export const onRequest: PagesFunction<Env> = () =>
  jsonError("Method not allowed.", 405);
