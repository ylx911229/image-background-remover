// PayPal REST API helpers - Edge Runtime compatible (no Node.js SDK)

export const PAYPAL_BASE = "https://api-m.sandbox.paypal.com";

// Credit pack config
export const CREDIT_PLANS: Record<string, { amount: string; credits: number; description: string }> = {
  Starter: { amount: "4.99", credits: 10, description: "10 HD background removals" },
  Popular: { amount: "12.99", credits: 30, description: "30 HD background removals" },
  "Pro Pack": { amount: "29.99", credits: 80, description: "80 HD background removals" },
};

// Subscription config
export const SUBSCRIPTION_PLANS: Record<string, { planId: string; credits: number; price: string }> = {
  Basic: {
    planId: process.env.PAYPAL_BASIC_PLAN_ID!,
    credits: 25,
    price: "9.99",
  },
  Pro: {
    planId: process.env.PAYPAL_PRO_PLAN_ID!,
    credits: 60,
    price: "19.99",
  },
};

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal token error: ${res.status}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function createOrder(amount: string, description: string): Promise<string> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: amount },
          description,
        },
      ],
      application_context: {
        brand_name: "Image Background Remover",
        user_action: "PAY_NOW",
      },
    }),
  });

  const data = await res.json() as { id: string };
  return data.id;
}

export async function captureOrder(orderId: string): Promise<{ status: string; id: string }> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Capture failed: ${res.status}`);
  }

  return res.json() as Promise<{ status: string; id: string }>;
}

export async function getSubscription(subscriptionId: string): Promise<{
  id: string;
  status: string;
  plan_id: string;
  subscriber?: { email_address: string };
  custom_id?: string;
}> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Get subscription failed: ${res.status}`);
  }

  return res.json() as Promise<any>;
}
