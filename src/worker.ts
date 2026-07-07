import * as googleCallback from "../functions/api/auth/google/callback";
import * as googleStart from "../functions/api/auth/google/start";
import * as logout from "../functions/api/auth/logout";
import * as me from "../functions/api/auth/me";
import * as removeBackground from "../functions/api/remove-background";

type Env = {
  ASSETS: Fetcher;
  DB: D1Database;
  REMOVEBG_API_KEY?: string;
  MAX_UPLOAD_MB?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  AUTH_SESSION_TTL_DAYS?: string;
};

type PagesHandler = PagesFunction<Env>;
type PagesEventContext = EventContext<Env, string, Record<string, string>>;

function createPagesContext(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): PagesEventContext {
  return {
    request: request as PagesEventContext["request"],
    env,
    params: {},
    data: {},
    functionPath: new URL(request.url).pathname,
    waitUntil: ctx.waitUntil.bind(ctx),
    passThroughOnException: ctx.passThroughOnException.bind(ctx),
    next: () => env.ASSETS.fetch(request),
  };
}

async function runPagesHandler(
  handler: PagesHandler,
  request: Request,
  env: Env,
  ctx: ExecutionContext,
) {
  return handler(createPagesContext(request, env, ctx));
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/remove-background") {
      return runPagesHandler(
        request.method === "POST"
          ? removeBackground.onRequestPost
          : removeBackground.onRequest,
        request,
        env,
        ctx,
      );
    }

    if (pathname === "/api/auth/me") {
      return runPagesHandler(
        request.method === "GET" ? me.onRequestGet : me.onRequest,
        request,
        env,
        ctx,
      );
    }

    if (pathname === "/api/auth/logout") {
      return runPagesHandler(
        request.method === "POST" ? logout.onRequestPost : logout.onRequest,
        request,
        env,
        ctx,
      );
    }

    if (pathname === "/api/auth/google/start") {
      return runPagesHandler(
        request.method === "GET" ? googleStart.onRequestGet : googleStart.onRequest,
        request,
        env,
        ctx,
      );
    }

    if (pathname === "/api/auth/google/callback") {
      return runPagesHandler(
        request.method === "GET"
          ? googleCallback.onRequestGet
          : googleCallback.onRequest,
        request,
        env,
        ctx,
      );
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
