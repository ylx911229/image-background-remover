import { jsonError, type AuthEnv } from "../../_lib/auth";
import {
  verifyCreemWebhookSignature,
  type CreemEnv,
} from "../../_lib/creem";
import { grantCreditsForPayment } from "../../_lib/payments";
import type { PlanId } from "../../_lib/plans";

type Env = AuthEnv & CreemEnv;

type CreemWebhookEvent = {
  id?: string;
  eventType?: string;
  object?: {
    id?: string;
    request_id?: string;
    status?: string;
    order?: {
      id?: string;
      status?: string;
    };
    metadata?: {
      userId?: string;
      planId?: string;
    };
  };
};

async function markEvent(
  env: Env,
  eventId: string,
  status: "processed" | "ignored" | "failed",
) {
  await env.DB.prepare(
    "UPDATE creem_webhook_events SET status = ?, processed_at = ? WHERE id = ?",
  )
    .bind(status, new Date().toISOString(), eventId)
    .run();
}

async function findPayment(env: Env, event: CreemWebhookEvent) {
  const checkoutId = event.object?.id || "";
  const requestId = event.object?.request_id || "";

  if (requestId) {
    return env.DB.prepare(
      `SELECT id, user_id AS userId, plan_id AS planId, status
      FROM payment_orders
      WHERE provider = 'creem' AND id = ?
      LIMIT 1`,
    )
      .bind(requestId)
      .first<{
        id: string;
        userId: string;
        planId: PlanId;
        status: string;
      }>();
  }

  if (checkoutId) {
    return env.DB.prepare(
      `SELECT id, user_id AS userId, plan_id AS planId, status
      FROM payment_orders
      WHERE provider = 'creem' AND provider_order_id = ?
      LIMIT 1`,
    )
      .bind(checkoutId)
      .first<{
        id: string;
        userId: string;
        planId: PlanId;
        status: string;
      }>();
  }

  return null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const rawBody = await request.text();
  let event: CreemWebhookEvent;

  try {
    event = JSON.parse(rawBody) as CreemWebhookEvent;
  } catch {
    return jsonError("Invalid webhook body.", 400);
  }

  if (!event.id || !event.eventType) {
    return jsonError("Invalid Creem webhook event.", 400);
  }

  const existing = await env.DB.prepare(
    "SELECT id, status FROM creem_webhook_events WHERE id = ? LIMIT 1",
  )
    .bind(event.id)
    .first<{ id: string; status: string }>();

  if (existing?.status === "processed" || existing?.status === "ignored") {
    return Response.json({ ok: true, duplicate: true });
  }

  if (!existing) {
    await env.DB.prepare(
      `INSERT INTO creem_webhook_events (
        id,
        event_type,
        resource_id,
        status,
        received_at,
        raw_event
      )
      VALUES (?, ?, ?, 'received', ?, ?)`,
    )
      .bind(
        event.id,
        event.eventType,
        event.object?.id || null,
        new Date().toISOString(),
        rawBody,
      )
      .run();
  }

  let verified = false;

  try {
    verified = await verifyCreemWebhookSignature(rawBody, request, env);
  } catch {
    await markEvent(env, event.id, "failed");
    return jsonError("Could not verify Creem webhook signature.", 401);
  }

  if (!verified) {
    await markEvent(env, event.id, "failed");
    return jsonError("Invalid Creem webhook signature.", 401);
  }

  try {
    if (event.eventType !== "checkout.completed") {
      await markEvent(env, event.id, "ignored");
      return Response.json({ ok: true });
    }

    const payment = await findPayment(env, event);

    if (!payment) {
      await markEvent(env, event.id, "ignored");
      return Response.json({ ok: true });
    }

    await grantCreditsForPayment(
      env,
      {
        id: payment.id,
        userId: payment.userId,
        planId: payment.planId,
      },
      event,
    );

    await markEvent(env, event.id, "processed");
    return Response.json({ ok: true });
  } catch {
    await markEvent(env, event.id, "failed");
    return jsonError("Could not process Creem webhook.", 500);
  }
};

export const onRequest: PagesFunction<Env> = () =>
  jsonError("Method not allowed.", 405);
