import { getSessionUser, jsonError, type AuthEnv } from "../../_lib/auth";
import { createCreemCheckout, type CreemEnv } from "../../_lib/creem";
import { getPaidPlan, type PaidPlanId } from "../../_lib/plans";

type Env = AuthEnv & CreemEnv;

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

  const paymentId = crypto.randomUUID();

  try {
    const checkout = await createCreemCheckout(
      env,
      plan as typeof plan & { id: PaidPlanId },
      paymentId,
      session.user,
      requestUrl,
    );

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
        created_at,
        raw_response
      )
      VALUES (?, ?, 'creem', ?, ?, ?, 'USD', ?, ?, ?)`,
    )
      .bind(
        paymentId,
        session.user.id,
        checkout.id,
        plan.id,
        plan.priceCents,
        checkout.status,
        new Date().toISOString(),
        JSON.stringify(checkout.raw),
      )
      .run();

    return Response.redirect(checkout.checkoutUrl, 303);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Could not start Creem checkout.",
      502,
    );
  }
};

export const onRequest: PagesFunction<Env> = () =>
  jsonError("Method not allowed.", 405);
