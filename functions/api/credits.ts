import { getSessionUser, jsonError, type AuthEnv } from "../_lib/auth";
import { getCreditSummary } from "../_lib/credits";

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => {
  const session = await getSessionUser(request, env);

  if (!session) {
    return Response.json(
      { authenticated: false, credits: null },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const credits = await getCreditSummary(env, session.user.id);

  return Response.json(
    { authenticated: true, credits },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
};

export const onRequest: PagesFunction<AuthEnv> = () =>
  jsonError("Method not allowed.", 405);
