import { type PaidPlanId, type Plan } from "./plans";

export type CreemEnv = {
  CREEM_API_KEY?: string;
  CREEM_ENVIRONMENT?: string;
  CREEM_PLUS_PRODUCT_ID?: string;
  CREEM_PRO_PRODUCT_ID?: string;
  CREEM_WEBHOOK_SECRET?: string;
};

type CreemCheckoutResponse = {
  id?: string;
  checkout_url?: string;
  checkoutUrl?: string;
  product_id?: string;
  product?: string;
  status?: string;
  message?: string;
  error?: string;
};

const CREEM_PROVIDER = "creem";

export function getCreemProductId(env: CreemEnv, planId: PaidPlanId) {
  return planId === "plus" ? env.CREEM_PLUS_PRODUCT_ID : env.CREEM_PRO_PRODUCT_ID;
}

function getCreemBaseUrl(env: CreemEnv) {
  return env.CREEM_ENVIRONMENT === "live"
    ? "https://api.creem.io/v1"
    : "https://test-api.creem.io/v1";
}

export async function createCreemCheckout(
  env: CreemEnv,
  plan: Plan & { id: PaidPlanId },
  paymentId: string,
  user: { id: string; email: string; name: string },
  requestUrl: URL,
) {
  if (!env.CREEM_API_KEY) {
    throw new Error("Creem API key is not configured.");
  }

  const productId = getCreemProductId(env, plan.id);

  if (!productId) {
    throw new Error(`Creem product id is not configured for ${plan.name}.`);
  }

  const response = await fetch(`${getCreemBaseUrl(env)}/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.CREEM_API_KEY,
    },
    body: JSON.stringify({
      product_id: productId,
      request_id: paymentId,
      success_url: `${requestUrl.origin}/api/creem/success`,
      customer: {
        email: user.email,
      },
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
    }),
  });
  const body = (await response.json().catch(() => ({}))) as CreemCheckoutResponse;
  const checkoutUrl = body.checkout_url || body.checkoutUrl;

  if (!response.ok || !body.id || !checkoutUrl) {
    throw new Error(
      body.message || body.error || "Could not create Creem checkout.",
    );
  }

  return {
    id: body.id,
    checkoutUrl,
    productId: body.product_id || body.product || productId,
    status: body.status || "pending",
    raw: body,
  };
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(hash);
}

async function hmacSha256Hex(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return bytesToHex(signature);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return diff === 0;
}

export async function verifyCreemRedirectSignature(url: URL, env: CreemEnv) {
  if (!env.CREEM_API_KEY) {
    throw new Error("Creem API key is not configured.");
  }

  const signature = url.searchParams.get("signature");

  if (!signature) {
    return false;
  }

  const entries: string[] = [];

  for (const [key, value] of url.searchParams.entries()) {
    if (key !== "signature" && value) {
      entries.push(`${key}=${value}`);
    }
  }

  entries.push(`salt=${env.CREEM_API_KEY}`);
  const expected = await sha256Hex(entries.join("|"));

  return timingSafeEqual(expected, signature);
}

export async function verifyCreemWebhookSignature(
  rawBody: string,
  request: Request,
  env: CreemEnv,
) {
  if (!env.CREEM_WEBHOOK_SECRET) {
    throw new Error("Creem webhook secret is not configured.");
  }

  const signature = request.headers.get("creem-signature");

  if (!signature) {
    return false;
  }

  const expected = await hmacSha256Hex(env.CREEM_WEBHOOK_SECRET, rawBody);

  return timingSafeEqual(expected, signature);
}

export { CREEM_PROVIDER };
