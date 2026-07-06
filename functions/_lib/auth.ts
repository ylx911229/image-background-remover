export type AuthEnv = {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  AUTH_SESSION_TTL_DAYS?: string;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

const SESSION_COOKIE = "ibr_session";
const DEFAULT_SESSION_TTL_DAYS = 30;

function base64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function randomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

export async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function jsonError(message: string, status: number) {
  return Response.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export function getCookie(request: Request, name: string) {
  const cookie = request.headers.get("Cookie");

  if (!cookie) {
    return null;
  }

  for (const part of cookie.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");

    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}

function shouldUseSecureCookie(request: Request) {
  const url = new URL(request.url);
  return url.protocol === "https:";
}

export function createSessionCookie(
  request: Request,
  token: string,
  expiresAt: Date,
) {
  const attributes = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${expiresAt.toUTCString()}`,
    `Max-Age=${Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))}`,
  ];

  if (shouldUseSecureCookie(request)) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export function clearSessionCookie(request: Request) {
  const attributes = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
  ];

  if (shouldUseSecureCookie(request)) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export function getSessionTtlDays(env: AuthEnv) {
  const configured = Number(env.AUTH_SESSION_TTL_DAYS);

  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_SESSION_TTL_DAYS;
}

export function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function getSessionUser(
  request: Request,
  env: AuthEnv,
): Promise<{ user: SessionUser; sessionId: string } | null> {
  const token = getCookie(request, SESSION_COOKIE);

  if (!token) {
    return null;
  }

  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT
      sessions.id AS sessionId,
      users.id,
      users.email,
      users.name,
      users.avatar_url AS avatarUrl
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
    LIMIT 1`,
  )
    .bind(tokenHash, new Date().toISOString())
    .first<{
      sessionId: string;
      id: string;
      email: string;
      name: string;
      avatarUrl: string | null;
    }>();

  if (!row) {
    return null;
  }

  return {
    sessionId: row.sessionId,
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatarUrl,
    },
  };
}

export async function deleteSession(request: Request, env: AuthEnv) {
  const token = getCookie(request, SESSION_COOKIE);

  if (!token) {
    return;
  }

  const tokenHash = await sha256Hex(token);
  await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?")
    .bind(tokenHash)
    .run();
}
