import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { captureOrder, CREDIT_PLANS } from "@/lib/paypal";

export const runtime = "edge";

export const POST = auth(async function POST(req: any) {
  const session = req.auth;
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, planName } = await req.json() as { orderId: string; planName: string };
    const plan = CREDIT_PLANS[planName];

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Capture payment
    const result = await captureOrder(orderId);

    if (result.status !== "COMPLETED") {
      return NextResponse.json({ error: "Payment not completed", status: result.status }, { status: 400 });
    }

    // Add credits to D1
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB as D1Database;
    const userId = session.user.email;

    await db.prepare(
      "INSERT OR IGNORE INTO user_credits (user_id, credits) VALUES (?, 0)"
    ).bind(userId).run();

    const updated = await db.prepare(
      "UPDATE user_credits SET credits = credits + ?, updated_at = unixepoch() WHERE user_id = ? RETURNING credits"
    ).bind(plan.credits, userId).first() as { credits: number } | null;

    const newTotal = updated?.credits ?? plan.credits;

    return NextResponse.json({
      success: true,
      creditsAdded: plan.credits,
      newTotal,
    });
  } catch (error: any) {
    console.error("Capture order error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}) as any;
