import { formatUsd, type Plan } from "./plans";

export type PayPalEnv = {
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_ENVIRONMENT?: string;
  PAYPAL_WEBHOOK_ID?: string;
};

type PayPalLink = {
  href: string;
  rel: string;
  method: string;
};

export type PayPalOrder = {
  id: string;
  status: string;
  links?: PayPalLink[];
};

export type PayPalCapture = {
  id: string;
  status: string;
};

function getPayPalBaseUrl(env: PayPalEnv) {
  return env.PAYPAL_ENVIRONMENT === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function base64(value: string) {
  return btoa(value);
}

export async function getPayPalAccessToken(env: PayPalEnv) {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials are not configured.");
  }

  const response = await fetch(`${getPayPalBaseUrl(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${base64(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const body = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    error_description?: string;
  };

  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description || "Could not authenticate with PayPal.");
  }

  return body.access_token;
}

export async function createPayPalOrder(
  env: PayPalEnv,
  plan: Plan,
  requestUrl: URL,
) {
  const accessToken = await getPayPalAccessToken(env);
  const response = await fetch(`${getPayPalBaseUrl(env)}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": crypto.randomUUID(),
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: plan.id,
          description: `${plan.name} plan - ${plan.credits} image credits`,
          amount: {
            currency_code: "USD",
            value: formatUsd(plan.priceCents),
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Image Background Remover",
            landing_page: "LOGIN",
            user_action: "PAY_NOW",
            return_url: `${requestUrl.origin}/api/paypal/capture`,
            cancel_url: `${requestUrl.origin}/pricing?payment=cancelled`,
          },
        },
      },
    }),
  });
  const body = (await response.json().catch(() => ({}))) as PayPalOrder & {
    message?: string;
  };

  if (!response.ok || !body.id) {
    throw new Error(body.message || "Could not create PayPal order.");
  }

  return body;
}

export async function capturePayPalOrder(env: PayPalEnv, orderId: string) {
  const accessToken = await getPayPalAccessToken(env);
  const response = await fetch(
    `${getPayPalBaseUrl(env)}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": crypto.randomUUID(),
      },
    },
  );
  const body = (await response.json().catch(() => ({}))) as PayPalCapture & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(body.message || "Could not capture PayPal order.");
  }

  return body;
}

export async function verifyPayPalWebhook(
  env: PayPalEnv,
  request: Request,
  webhookEvent: unknown,
) {
  if (!env.PAYPAL_WEBHOOK_ID) {
    throw new Error("PayPal webhook id is not configured.");
  }

  const accessToken = await getPayPalAccessToken(env);
  const response = await fetch(
    `${getPayPalBaseUrl(env)}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: request.headers.get("PAYPAL-AUTH-ALGO") || "",
        cert_url: request.headers.get("PAYPAL-CERT-URL") || "",
        transmission_id: request.headers.get("PAYPAL-TRANSMISSION-ID") || "",
        transmission_sig: request.headers.get("PAYPAL-TRANSMISSION-SIG") || "",
        transmission_time: request.headers.get("PAYPAL-TRANSMISSION-TIME") || "",
        webhook_id: env.PAYPAL_WEBHOOK_ID,
        webhook_event: webhookEvent,
      }),
    },
  );
  const body = (await response.json().catch(() => ({}))) as {
    verification_status?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(body.message || "Could not verify PayPal webhook signature.");
  }

  return body.verification_status === "SUCCESS";
}
