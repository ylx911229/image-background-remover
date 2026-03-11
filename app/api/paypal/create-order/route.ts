import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createOrder, CREDIT_PLANS } from "@/lib/paypal";

export const runtime = "edge";

export const POST = auth(async function POST(req: any) {
  const session = req.auth;
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { planName } = await req.json() as { planName: string };
    const plan = CREDIT_PLANS[planName];

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const orderId = await createOrder(plan.amount, plan.description);
    return NextResponse.json({ orderId });
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}) as any;
