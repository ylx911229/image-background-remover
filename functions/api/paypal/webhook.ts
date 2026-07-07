import { jsonError, type AuthEnv } from "../../_lib/auth";
import {
  capturePayPalOrder,
  verifyPayPalWebhook,
  type PayPalEnv,
} from "../../_lib/paypal";
import { grantCreditsForPayment } from "../../_lib/payments";
import type { PlanId } from "../../_lib/plans";

type Env = AuthEnv & PayPalEnv;

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
  };
};

async function findPaymentByOrderId(env: Env, orderId: string) {
  return env.DB.prepare(
    `SELECT id, user_id AS userId, plan_id AS planId, status
    FROM payment_orders
    WHERE provider = 'paypal' AND provider_order_id = ?
    LIMIT 1`,
  )
    .bind(orderId)
    .first<{
      id: string;
      userId: string;
      planId: PlanId;
      status: string;
    }>();
}

async function markEvent(
  env: Env,
  eventId: string,
  status: "processed" | "ignored" | "failed",
) {
  await env.DB.prepare(
    "UPDATE paypal_webhook_events SET status = ?, processed_at = ? WHERE id = ?",
  )
    .bind(status, new Date().toISOString(), eventId)
    .run();
}

async function fulfillCompletedOrder(
  env: Env,
  orderId: string,
  rawEvent: unknown,
) {
  const payment = await findPaymentByOrderId(env, orderId);

  if (!payment) {
    return false;
  }

  await grantCreditsForPayment(
    env,
    {
      id: payment.id,
      userId: payment.userId,
      planId: payment.planId,
    },
    rawEvent,
  );

  return true;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let event: PayPalWebhookEvent;

  try {
    event = (await request.json()) as PayPalWebhookEvent;
  } catch {
    return jsonError("Invalid webhook body.", 400);
  }

  if (!event.id || !event.event_type) {
    return jsonError("Invalid PayPal webhook event.", 400);
  }

  const existing = await env.DB.prepare(
    "SELECT id, status FROM paypal_webhook_events WHERE id = ? LIMIT 1",
  )
    .bind(event.id)
    .first<{ id: string; status: string }>();

  if (existing?.status === "processed" || existing?.status === "ignored") {
    return Response.json({ ok: true, duplicate: true });
  }

  if (!existing) {
    await env.DB.prepare(
      `INSERT INTO paypal_webhook_events (
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
        event.event_type,
        event.resource?.id || null,
        new Date().toISOString(),
        JSON.stringify(event),
      )
      .run();
  }

  let verified = false;

  try {
    verified = await verifyPayPalWebhook(env, request, event);
  } catch {
    await markEvent(env, event.id, "failed");
    return jsonError("Could not verify PayPal webhook signature.", 401);
  }

  if (!verified) {
    await markEvent(env, event.id, "failed");
    return jsonError("Invalid PayPal webhook signature.", 401);
  }

  try {
    if (event.event_type === "CHECKOUT.ORDER.APPROVED" && event.resource?.id) {
      const capture = await capturePayPalOrder(env, event.resource.id);

      if (capture.status === "COMPLETED") {
        await fulfillCompletedOrder(env, event.resource.id, capture);
      }

      await markEvent(env, event.id, "processed");
      return Response.json({ ok: true });
    }

    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id;

      if (orderId) {
        await fulfillCompletedOrder(env, orderId, event);
      }

      await markEvent(env, event.id, orderId ? "processed" : "ignored");
      return Response.json({ ok: true });
    }

    await markEvent(env, event.id, "ignored");
    return Response.json({ ok: true });
  } catch {
    await markEvent(env, event.id, "failed");
    return jsonError("Could not process PayPal webhook.", 500);
  }
};

export const onRequest: PagesFunction<Env> = () =>
  jsonError("Method not allowed.", 405);
