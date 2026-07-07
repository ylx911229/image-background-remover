import { getSessionUser, jsonError, type AuthEnv } from "../../_lib/auth";
import {
  verifyCreemRedirectSignature,
  type CreemEnv,
} from "../../_lib/creem";
import { grantCreditsForPayment } from "../../_lib/payments";
import type { PlanId } from "../../_lib/plans";

type Env = AuthEnv & CreemEnv;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const requestUrl = new URL(request.url);
  const requestId = requestUrl.searchParams.get("request_id");
  const checkoutId = requestUrl.searchParams.get("checkout_id");

  if (!requestId || !checkoutId) {
    return Response.redirect(`${requestUrl.origin}/pricing?payment=missing`, 303);
  }

  const session = await getSessionUser(request, env);

  if (!session) {
    const redirect = encodeURIComponent(
      `/api/creem/success${requestUrl.search}`,
    );
    return Response.redirect(
      `${requestUrl.origin}/api/auth/google/start?redirect=${redirect}`,
      303,
    );
  }

  let verified = false;

  try {
    verified = await verifyCreemRedirectSignature(requestUrl, env);
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Could not verify Creem payment redirect.",
      502,
    );
  }

  if (!verified) {
    return Response.redirect(`${requestUrl.origin}/pricing?payment=invalid`, 303);
  }

  const payment = await env.DB.prepare(
    `SELECT id, user_id AS userId, plan_id AS planId, status
    FROM payment_orders
    WHERE provider = 'creem' AND id = ? AND provider_order_id = ?
    LIMIT 1`,
  )
    .bind(requestId, checkoutId)
    .first<{
      id: string;
      userId: string;
      planId: PlanId;
      status: string;
    }>();

  if (!payment || payment.userId !== session.user.id) {
    return Response.redirect(`${requestUrl.origin}/pricing?payment=unknown`, 303);
  }

  if (payment.status === "COMPLETED") {
    return Response.redirect(`${requestUrl.origin}/pricing?payment=success`, 303);
  }

  try {
    await grantCreditsForPayment(
      env,
      {
        id: payment.id,
        userId: session.user.id,
        planId: payment.planId,
      },
      Object.fromEntries(requestUrl.searchParams.entries()),
    );

    return Response.redirect(`${requestUrl.origin}/pricing?payment=success`, 303);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Could not complete Creem payment.",
      502,
    );
  }
};

export const onRequest: PagesFunction<Env> = () =>
  jsonError("Method not allowed.", 405);
