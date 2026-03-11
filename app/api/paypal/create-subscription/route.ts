import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAccessToken, PAYPAL_BASE, SUBSCRIPTION_PLANS } from "@/lib/paypal";

export const runtime = "edge";

export const POST = auth(async function POST(req: any) {
  const session = req.auth;
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { planName } = await req.json() as { planName: string };
    const plan = SUBSCRIPTION_PLANS[planName];

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const token = await getAccessToken();
    const baseUrl = "https://imagebackgroundremover.shop";

    const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `sub-${session.user.email}-${Date.now()}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        plan_id: plan.planId,
        custom_id: session.user.email, // used to identify user in webhook
        subscriber: {
          email_address: session.user.email,
        },
        application_context: {
          brand_name: "Image Background Remover",
          locale: "en-US",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${baseUrl}/pricing?subscribed=1`,
          cancel_url: `${baseUrl}/pricing?cancelled=1`,
        },
      }),
    });

    const data = await res.json() as {
      id: string;
      status: string;
      links: Array<{ href: string; rel: string }>;
    };

    const approveLink = data.links?.find((l) => l.rel === "approve")?.href;

    return NextResponse.json({
      subscriptionId: data.id,
      approveUrl: approveLink,
    });
  } catch (error: any) {
    console.error("Create subscription error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}) as any;
