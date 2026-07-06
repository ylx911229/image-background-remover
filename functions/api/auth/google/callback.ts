import {
  createSessionCookie,
  getAuthBaseUrl,
  getGoogleRedirectUri,
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

function getFailureRedirect(authBaseUrl: string, reason: string) {
  return Response.redirect(
    `${authBaseUrl}/?auth=failed&reason=${encodeURIComponent(reason)}`,
    302,
  );
}

async function exchangeCode(
  request: Request,
  env: AuthEnv,
  code: string,
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID || "",
    client_secret: env.GOOGLE_CLIENT_SECRET || "",
    code,
    grant_type: "authorization_code",
    redirect_uri: getGoogleRedirectUri(request, env),
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
    console.error("Google OAuth token exchange failed", {
      status: response.status,
      error: payload.error,
      errorDescription: payload.error_description,
    });
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
    console.error("Google OAuth userinfo failed", { status: response.status });
    throw new Error("Could not read Google profile.");
  }

  return payload;
}

export const onRequestGet: PagesFunction<AuthEnv> = async ({
  request,
  env,
  waitUntil,
}) => {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const missingConfig = [
    !clientId ? "GOOGLE_CLIENT_ID" : null,
    !clientSecret ? "GOOGLE_CLIENT_SECRET" : null,
  ].filter(Boolean);

  if (!clientId || !clientSecret) {
    return jsonError(
      `Google OAuth is not configured. Missing: ${missingConfig.join(", ")}.`,
      500,
    );
  }

  const requestUrl = new URL(request.url);
  const authBaseUrl = getAuthBaseUrl(request, env);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (!code || !state) {
    return Response.redirect(`${authBaseUrl}/?auth=missing`, 302);
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
    return Response.redirect(`${authBaseUrl}/?auth=expired`, 302);
  }

  let failureReason = "unknown";

  try {
    failureReason = "token_exchange";
    const token = await exchangeCode(request, env, code);

    if (!token.access_token) {
      throw new Error("Google did not return an access token.");
    }

    failureReason = "profile";
    const profile = await fetchGoogleUser(token.access_token);

    if (!profile.sub || !profile.email) {
      throw new Error("Google profile is missing an id or email.");
    }

    const now = new Date();
    const userId = randomToken(18);
    const displayName = profile.name || profile.email.split("@")[0];

    failureReason = "upsert_user";
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

    failureReason = "select_user";
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

    failureReason = "upsert_oauth_account";
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

    failureReason = "create_session";
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

    waitUntil(
      env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?")
        .bind(new Date().toISOString())
        .run()
        .catch((error) => {
          console.error("Session cleanup failed after Google OAuth login", {
            message: error instanceof Error ? error.message : String(error),
          });
        }),
    );

    const redirectPath = getSafeRedirectPath(stateRow.redirectPath);
    const response = Response.redirect(`${authBaseUrl}${redirectPath}`, 302);
    response.headers.append(
      "Set-Cookie",
      createSessionCookie(request, sessionToken, expiresAt),
    );

    return response;
  } catch (error) {
    console.error("Google OAuth callback failed", {
      reason: failureReason,
      message: error instanceof Error ? error.message : String(error),
    });

    return getFailureRedirect(authBaseUrl, failureReason);
  }
};

export const onRequest: PagesFunction<AuthEnv> = () =>
  jsonError("Method not allowed.", 405);
