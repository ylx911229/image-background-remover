import { PLANS } from "./plans";

export type CreditEnv = {
  DB: D1Database;
};

export type CreditSummary = {
  freeUsed: number;
  freeRemaining: number;
  purchasedRemaining: number;
  totalRemaining: number;
};

function getMonthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function getNextMonthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

export function getCreditPeriod() {
  return {
    startsAt: getMonthStart().toISOString(),
    endsAt: getNextMonthStart().toISOString(),
  };
}

export async function getCreditSummary(
  env: CreditEnv,
  userId: string,
): Promise<CreditSummary> {
  const period = getCreditPeriod();
  const freeRow = await env.DB.prepare(
    `SELECT COUNT(*) AS count
    FROM credit_events
    WHERE user_id = ?
      AND event_type = 'free_usage'
      AND created_at >= ?
      AND created_at < ?`,
  )
    .bind(userId, period.startsAt, period.endsAt)
    .first<{ count: number }>();
  const purchasedRow = await env.DB.prepare(
    `SELECT COALESCE(SUM(remaining_credits), 0) AS remaining
    FROM credit_grants
    WHERE user_id = ?
      AND remaining_credits > 0
      AND expires_at > ?`,
  )
    .bind(userId, new Date().toISOString())
    .first<{ remaining: number }>();

  const freeUsed = Number(freeRow?.count || 0);
  const freeRemaining = Math.max(0, PLANS.free.credits - freeUsed);
  const purchasedRemaining = Number(purchasedRow?.remaining || 0);

  return {
    freeUsed,
    freeRemaining,
    purchasedRemaining,
    totalRemaining: freeRemaining + purchasedRemaining,
  };
}

export async function consumeCredit(env: CreditEnv, userId: string) {
  const now = new Date().toISOString();
  const grant = await env.DB.prepare(
    `SELECT id
    FROM credit_grants
    WHERE user_id = ?
      AND remaining_credits > 0
      AND expires_at > ?
    ORDER BY expires_at ASC, created_at ASC
    LIMIT 1`,
  )
    .bind(userId, now)
    .first<{ id: string }>();

  if (grant) {
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE credit_grants SET remaining_credits = remaining_credits - 1 WHERE id = ?",
      ).bind(grant.id),
      env.DB.prepare(
        `INSERT INTO credit_events (id, user_id, event_type, delta, grant_id, created_at)
        VALUES (?, ?, 'purchase_usage', -1, ?, ?)`,
      ).bind(crypto.randomUUID(), userId, grant.id, now),
    ]);

    return true;
  }

  const summary = await getCreditSummary(env, userId);

  if (summary.freeRemaining <= 0) {
    return false;
  }

  await env.DB.prepare(
    `INSERT INTO credit_events (id, user_id, event_type, delta, created_at)
    VALUES (?, ?, 'free_usage', -1, ?)`,
  )
    .bind(crypto.randomUUID(), userId, now)
    .run();

  return true;
}
