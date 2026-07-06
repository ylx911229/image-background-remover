import {
  createSessionCookie,
  getSafeRedirectPath,
  getSessionTtlDays,
  jsonError,
  randomToken,
  sha256Hex,
  type AuthEnv,
} from "../../../_lib/auth";

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

async function exchangeCode(
  request: Request,
  env: AuthEnv,
  code: string,
): Promise<GoogleTokenResponse> {
  const url = new URL(request.url);
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID || "",
    client_secret: env.GOOGLE_CLIENT_SECRET || "",
    code,
    grant_type: "authorization_code",
    redirect_uri: `${url.origin}/api/auth/google/callback`,
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json().catch(() => ({}))) as GoogleTokenResponse;

  if (!response.ok) {
    throw new Error(
      payload.error_description || payload.error || "Google token exchange failed.",
    );
  }

  return payload;
}

async function fetchGoogleUser(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as GoogleUserInfo;

  if (!response.ok) {
    throw new Error("Could not read Google profile.");
  }

  return payload;
}

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return jsonError("Google OAuth is not configured.", 500);
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (!code || !state) {
    return Response.redirect(`${requestUrl.origin}/?auth=missing`, 302);
  }

  const stateRow = await env.DB.prepare(
    "SELECT redirect_path AS redirectPath FROM oauth_states WHERE state = ? AND expires_at > ? LIMIT 1",
  )
    .bind(state, new Date().toISOString())
    .first<{ redirectPath: string }>();

  await env.DB.prepare("DELETE FROM oauth_states WHERE state = ? OR expires_at <= ?")
    .bind(state, new Date().toISOString())
    .run();

  if (!stateRow) {
    return Response.redirect(`${requestUrl.origin}/?auth=expired`, 302);
  }

  try {
    const token = await exchangeCode(request, env, code);

    if (!token.access_token) {
      throw new Error("Google did not return an access token.");
    }

    const profile = await fetchGoogleUser(token.access_token);

    if (!profile.sub || !profile.email) {
      throw new Error("Google profile is missing an id or email.");
    }

    const now = new Date();
    const userId = randomToken(18);
    const displayName = profile.name || profile.email.split("@")[0];

    await env.DB.prepare(
      `INSERT INTO users (
        id,
        email,
        name,
        avatar_url,
        email_verified,
        created_at,
        updated_at,
        last_login_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        name = excluded.name,
        avatar_url = excluded.avatar_url,
        email_verified = excluded.email_verified,
        updated_at = excluded.updated_at,
        last_login_at = excluded.last_login_at`,
    )
      .bind(
        userId,
        profile.email,
        displayName,
        profile.picture || null,
        profile.email_verified ? 1 : 0,
        now.toISOString(),
        now.toISOString(),
        now.toISOString(),
      )
      .run();

    const user = await env.DB.prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
      .bind(profile.email)
      .first<{ id: string }>();

    if (!user) {
      throw new Error("Could not create user.");
    }

    const accessTokenExpiresAt =
      typeof token.expires_in === "number"
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : null;

    await env.DB.prepare(
      `INSERT INTO oauth_accounts (
        provider,
        provider_user_id,
        user_id,
        scope,
        access_token_expires_at,
        created_at,
        updated_at
      )
      VALUES ('google', ?, ?, ?, ?, ?, ?)
      ON CONFLICT(provider, provider_user_id) DO UPDATE SET
        user_id = excluded.user_id,
        scope = excluded.scope,
        access_token_expires_at = excluded.access_token_expires_at,
        updated_at = excluded.updated_at`,
    )
      .bind(
        profile.sub,
        user.id,
        token.scope || null,
        accessTokenExpiresAt,
        now.toISOString(),
        now.toISOString(),
      )
      .run();

    const sessionToken = randomToken(32);
    const sessionId = randomToken(18);
    const sessionHash = await sha256Hex(sessionToken);
    const expiresAt = new Date(
      Date.now() + getSessionTtlDays(env) * 24 * 60 * 60 * 1000,
    );

    await env.DB.prepare(
      `INSERT INTO sessions (
        id,
        user_id,
        token_hash,
        expires_at,
        created_at,
        last_seen_at,
        user_agent
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        sessionId,
        user.id,
        sessionHash,
        expiresAt.toISOString(),
        now.toISOString(),
        now.toISOString(),
        request.headers.get("User-Agent"),
      )
      .run();

    await env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?")
      .bind(new Date().toISOString())
      .run();

    const redirectPath = getSafeRedirectPath(stateRow.redirectPath);
    const response = Response.redirect(`${requestUrl.origin}${redirectPath}`, 302);
    response.headers.append(
      "Set-Cookie",
      createSessionCookie(request, sessionToken, expiresAt),
    );

    return response;
  } catch {
    return Response.redirect(`${requestUrl.origin}/?auth=failed`, 302);
  }
};

export const onRequest: PagesFunction<AuthEnv> = () =>
  jsonError("Method not allowed.", 405);
