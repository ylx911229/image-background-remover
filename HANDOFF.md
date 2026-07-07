# Image Background Remover Handoff

Last updated: 2026-07-07

## Current Status

The site is live at:

- Production domain: https://imagebackgroundremover.shop
- Workers fallback: https://image-background-remover.potter-faa.workers.dev

The app is a Next.js static export deployed as a Cloudflare Worker with Workers Assets. API routes are handled by `src/worker.ts`, which adapts the existing `functions/api/*` handlers.

Latest known production deploy at the time PayPal was switched to Live:

- Cloudflare Worker version: `1fdfbc3d-c91c-48f9-8065-6ff9861a6a8e`
- Git commit: `cab1819 switch paypal to live`

Later changes may have triggered new Cloudflare versions via secret updates or manual deploys. Always verify with `npx wrangler deployments list` before diagnosing production behavior.

## Core Product

The app removes image backgrounds using remove.bg.

Current public plans:

- Free: 3 images/month
- Plus: $9/month, 30 image credits
- Pro: $29/month, 150 image credits

Payment is one-time monthly credit purchase, not recurring subscription.

## Key Files

- `app/page.tsx`: homepage and tool entry.
- `app/pricing/page.tsx`: pricing page and PayPal checkout forms.
- `components/background-remover-tool.tsx`: upload/remove/download UI.
- `components/auth-button.tsx`: Google login/logout display.
- `components/credit-status.tsx`: shows payment success/cancelled status and remaining credits.
- `src/worker.ts`: Cloudflare Worker entry and API route dispatcher.
- `functions/api/remove-background.ts`: checks login/credits, calls remove.bg, deducts one credit on success.
- `functions/api/auth/*`: Google OAuth login/logout/session endpoints.
- `functions/api/paypal/*`: PayPal create order, capture, webhook.
- `functions/api/credits.ts`: returns current user's credit balance.
- `functions/_lib/auth.ts`: auth/session helpers.
- `functions/_lib/credits.ts`: credit summary and deduction logic.
- `functions/_lib/payments.ts`: idempotent credit grant helper.
- `functions/_lib/paypal.ts`: PayPal API helpers and webhook signature verification.
- `functions/_lib/plans.ts`: plan IDs, pricing, credit amounts.
- `migrations/*.sql`: D1 database schema.
- `wrangler.jsonc`: Cloudflare Worker config.
- `.github/workflows/deploy-workers.yml`: GitHub Actions deployment workflow.

## Cloudflare

Account:

- Account name: `potter`
- Account ID: `faae494a756090f5f9c0ad7b8d1ddb88`

Worker:

- Name: `image-background-remover`
- Route: `imagebackgroundremover.shop/*`
- Assets directory: `./out`
- Worker entry: `./src/worker.ts`

D1:

- Binding: `DB`
- Database name: `image-background-remover-auth`
- Database ID: `6e30418d-3ff7-4bb4-86ee-7c31c63e4dd7`

Configured Worker secrets:

- `GOOGLE_CLIENT_SECRET`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `REMOVEBG_API_KEY`
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET` (needed after creating the Creem Dashboard webhook)

Public Worker vars in `wrangler.jsonc`:

- `MAX_UPLOAD_MB=10`
- `GOOGLE_CLIENT_ID`
- `AUTH_BASE_URL=https://imagebackgroundremover.shop`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_ENVIRONMENT=live`
- `CREEM_ENVIRONMENT=test`
- `CREEM_PLUS_PRODUCT_ID`
- `CREEM_PRO_PRODUCT_ID`

Do not commit secret values.

## PayPal

PayPal is currently configured for Live mode.

Live webhook:

- Webhook ID: `9C580398VF4364546`
- URL: `https://imagebackgroundremover.shop/api/paypal/webhook`
- Events:
  - `CHECKOUT.ORDER.APPROVED`
  - `PAYMENT.CAPTURE.COMPLETED`

Checkout behavior:

1. User clicks Plus/Pro on `/pricing`.
2. `POST /api/paypal/create-order` creates a PayPal order.
3. User completes payment on PayPal.
4. PayPal redirects to `/api/paypal/capture`.
5. The app captures the order and grants credits.
6. Webhook also verifies/captures/fulfills idempotently.

Important implementation detail:

- PayPal returns the checkout URL as `rel: "payer-action"` in current API responses. Code also supports old `rel: "approve"`.

Security note:

- Live PayPal credentials were shared in chat during setup. After verifying production payments, regenerate the Live Client Secret in PayPal and update Cloudflare `PAYPAL_CLIENT_SECRET`.

## Creem

Creem is being added as a second payment provider alongside PayPal.

Current Creem mode:

- `CREEM_ENVIRONMENT=test`

Test products created in Creem:

- Plus: `prod_ffLj3daZrahJANfayIUar`
- Pro: `prod_1PfeErZ0QirhWWkmnRrn3n`

Checkout behavior:

1. User clicks Pay with card on `/pricing`.
2. `POST /api/creem/create-checkout` creates a Creem checkout.
3. User completes payment on Creem.
4. Creem redirects to `/api/creem/success`.
5. The redirect signature is verified and credits are granted idempotently.
6. `POST /api/creem/webhook` also handles `checkout.completed` once the Creem webhook is configured.

Webhook setup note:

- Public Creem API/CLI currently exposes products/checkouts but not webhook creation.
- Create a test webhook in the Creem Dashboard for `https://imagebackgroundremover.shop/api/creem/webhook`.
- Subscribe at least to `checkout.completed`.
- Copy the signing secret into Cloudflare as `CREEM_WEBHOOK_SECRET`.
- A stray test product named `Probe Recurring` may exist from API probing and can be archived in the Creem Dashboard.

## Google OAuth

Google login is implemented and working after setting `GOOGLE_CLIENT_SECRET` in Cloudflare.

Required Authorized redirect URI in Google Cloud Console:

```text
https://imagebackgroundremover.shop/api/auth/google/callback
```

The code uses `AUTH_BASE_URL` to force the canonical production origin for OAuth redirect URI and session redirects.

## remove.bg

Background removal uses:

```text
https://api.remove.bg/v1.0/removebg
```

Header:

```text
X-Api-Key: env.REMOVEBG_API_KEY
```

`REMOVEBG_API_KEY` is configured in Cloudflare Worker secrets.

## Credit Logic

Credit rules:

- Login required for background removal.
- If total remaining credits are 0, `/api/remove-background` returns HTTP 402.
- One credit is deducted only after remove.bg returns a successful response.
- Failed remove.bg calls do not deduct credits.
- Free credits: 3 per calendar month.
- Paid credits: granted for 30 days from purchase.
- Paid credits are consumed before free credits.

Main D1 tables:

- `users`
- `sessions`
- `oauth_states`
- `oauth_accounts`
- `payment_orders`
- `credit_grants`
- `credit_events`
- `paypal_webhook_events`

## Deployment

Local verification:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

Manual deploy:

```bash
npm run build
npx wrangler deploy
```

Apply D1 migrations:

```bash
npx wrangler d1 migrations apply image-background-remover-auth --remote
```

GitHub Actions workflow exists at:

```text
.github/workflows/deploy-workers.yml
```

It runs on push to `main`:

1. `npm ci`
2. `npm run typecheck`
3. `npm run build`
4. `npx wrangler d1 migrations apply image-background-remover-auth --remote`
5. `npx wrangler deploy`

Required GitHub Actions secret:

```text
CLOUDFLARE_API_TOKEN
```

The provided Cloudflare token was verified locally with:

```bash
npx wrangler whoami
npx wrangler deploy --dry-run
```

If GitHub Actions deploy does not update the Worker, check the Actions logs first. Previous symptoms showed pushes reaching GitHub but Worker not updating until manual `npx wrangler deploy`.

## Recent Timeline

- Converted app from Cloudflare Pages config to Workers + Assets.
- Bound domain route `imagebackgroundremover.shop/*`.
- Added pricing page.
- Added Google OAuth and session display fixes.
- Added PayPal checkout, capture, webhook, and D1 credit system.
- Switched PayPal from sandbox to Live.
- Added credit balance UI on homepage and pricing page.
- Configured remove.bg API key in Cloudflare.
- Added GitHub Actions deployment workflow.

## Known Risks / Follow-ups

- GitHub Actions auto-deploy should be verified in GitHub UI. Local `gh` CLI was not installed, so run status could not be inspected from this machine.
- PayPal Live credentials and remove.bg key were shared in chat; rotate secrets after production validation.
- Payment UX is basic. There is no dedicated account/billing page yet.
- No admin dashboard exists for payments/credits.
- No refund/reversal handling is implemented yet. Webhook currently handles order approval and capture completed only.
- The workflow uses a long-lived Cloudflare API token stored in GitHub Secrets. Prefer a scoped token with only required permissions.

## Useful Debug Commands

List Cloudflare secrets:

```bash
npx wrangler secret list
```

Inspect deployments:

```bash
npx wrangler deployments list
```

Inspect current D1 state:

```bash
npx wrangler d1 execute image-background-remover-auth --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

Check credit grants:

```bash
npx wrangler d1 execute image-background-remover-auth --remote --command "SELECT user_id, plan_id, total_credits, remaining_credits, expires_at FROM credit_grants ORDER BY created_at DESC LIMIT 20;"
```

Check payment orders:

```bash
npx wrangler d1 execute image-background-remover-auth --remote --command "SELECT provider_order_id, plan_id, amount_cents, currency, status, captured_at FROM payment_orders ORDER BY created_at DESC LIMIT 20;"
```
