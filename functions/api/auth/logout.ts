import {
  clearSessionCookie,
  deleteSession,
  jsonError,
  type AuthEnv,
} from "../../_lib/auth";

export const onRequestPost: PagesFunction<AuthEnv> = async ({ request, env }) => {
  await deleteSession(request, env);

  const response = Response.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
  response.headers.append("Set-Cookie", clearSessionCookie(request));

  return response;
};

export const onRequest: PagesFunction<AuthEnv> = () =>
  jsonError("Method not allowed.", 405);
