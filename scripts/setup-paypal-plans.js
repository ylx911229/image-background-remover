// 创建 PayPal Sandbox 订阅 Plans
const PAYPAL_BASE = "https://api-m.sandbox.paypal.com";
const CLIENT_ID = "AWpItvsSz5htPWbkgAkzqJXxISN8ei-pGt2kFDPlMfr_T17DMnTkLU0_xM3GFBlUyBmPsBs0PXMfQ2AV";
const CLIENT_SECRET = "EKdNf-K4XTyIMc5cfil6TuCVxWi1OL4vEvrCEM0t3kUEfCIPlwUDFtgdQWi3JFX_14B49bstMna0BnlL";

async function getToken() {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

async function main() {
  console.log("Getting PayPal access token...");
  const token = await getToken();

  // 1. Create Product
  console.log("Creating product...");
  const productRes = await fetch(`${PAYPAL_BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": "product-ibr-001",
    },
    body: JSON.stringify({
      name: "Image Background Remover Credits",
      description: "AI-powered background removal service",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  const product = await productRes.json();
  console.log("Product:", product.id, product.name);

  // 2. Create Basic Plan ($9.99/month, 25 credits)
  console.log("Creating Basic plan...");
  const basicRes = await fetch(`${PAYPAL_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": "plan-basic-001",
      "Prefer": "return=representation",
    },
    body: JSON.stringify({
      product_id: product.id,
      name: "Basic Monthly",
      description: "25 HD background removals per month",
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: "9.99", currency_code: "USD" },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: { value: "0", currency_code: "USD" },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  });
  const basicPlan = await basicRes.json();
  console.log("Basic Plan ID:", basicPlan.id);

  // 3. Create Pro Plan ($19.99/month, 60 credits)
  console.log("Creating Pro plan...");
  const proRes = await fetch(`${PAYPAL_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": "plan-pro-001",
      "Prefer": "return=representation",
    },
    body: JSON.stringify({
      product_id: product.id,
      name: "Pro Monthly",
      description: "60 HD background removals per month",
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: "19.99", currency_code: "USD" },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: { value: "0", currency_code: "USD" },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  });
  const proPlan = await proRes.json();
  console.log("Pro Plan ID:", proPlan.id);

  console.log("\n=== Plan IDs to save ===");
  console.log(`PAYPAL_BASIC_PLAN_ID=${basicPlan.id}`);
  console.log(`PAYPAL_PRO_PLAN_ID=${proPlan.id}`);
}

main().catch(console.error);
