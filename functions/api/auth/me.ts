import { getSessionUser, jsonError, type AuthEnv } from "../../_lib/auth";

export const onRequestGet: PagesFunction<AuthEnv> = async ({
  request,
  env,
  waitUntil,
}) => {
  const session = await getSessionUser(request, env);

  if (!session) {
    return Response.json(
      { user: null },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  waitUntil(
    env.DB.prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), session.sessionId)
      .run(),
  );

  return Response.json(
    { user: session.user },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
};

export const onRequest: PagesFunction<AuthEnv> = () =>
  jsonError("Method not allowed.", 405);
