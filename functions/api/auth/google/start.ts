import {
  getSafeRedirectPath,
  jsonError,
  randomToken,
  type AuthEnv,
} from "../../../_lib/auth";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const STATE_TTL_MINUTES = 10;

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return jsonError("Google OAuth is not configured.", 500);
  }

  const requestUrl = new URL(request.url);
  const redirectPath = getSafeRedirectPath(
    requestUrl.searchParams.get("redirect"),
  );
  const state = randomToken(32);
  const expiresAt = new Date(Date.now() + STATE_TTL_MINUTES * 60 * 1000);

  await env.DB.prepare(
    "INSERT INTO oauth_states (state, redirect_path, expires_at) VALUES (?, ?, ?)",
  )
    .bind(state, redirectPath, expiresAt.toISOString())
    .run();

  await env.DB.prepare("DELETE FROM oauth_states WHERE expires_at <= ?")
    .bind(new Date().toISOString())
    .run();

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set(
    "redirect_uri",
    `${requestUrl.origin}/api/auth/google/callback`,
  );
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "select_account");

  return Response.redirect(authUrl.toString(), 302);
};

export const onRequest: PagesFunction<AuthEnv> = () =>
  jsonError("Method not allowed.", 405);
