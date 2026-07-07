import * as googleCallback from "../functions/api/auth/google/callback";
import * as googleStart from "../functions/api/auth/google/start";
import * as credits from "../functions/api/credits";
import * as logout from "../functions/api/auth/logout";
import * as me from "../functions/api/auth/me";
import * as paypalCapture from "../functions/api/paypal/capture";
import * as paypalCreateOrder from "../functions/api/paypal/create-order";
import * as paypalWebhook from "../functions/api/paypal/webhook";
import * as removeBackground from "../functions/api/remove-background";

type Env = {
  ASSETS: Fetcher;
  DB: D1Database;
  REMOVEBG_API_KEY?: string;
  MAX_UPLOAD_MB?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  AUTH_SESSION_TTL_DAYS?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_ENVIRONMENT?: string;
  PAYPAL_WEBHOOK_ID?: string;
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

    if (pathname === "/api/credits") {
      return runPagesHandler(
        request.method === "GET" ? credits.onRequestGet : credits.onRequest,
        request,
        env,
        ctx,
      );
    }

    if (pathname === "/api/paypal/create-order") {
      return runPagesHandler(
        request.method === "POST"
          ? paypalCreateOrder.onRequestPost
          : paypalCreateOrder.onRequest,
        request,
        env,
        ctx,
      );
    }

    if (pathname === "/api/paypal/capture") {
      return runPagesHandler(
        request.method === "GET"
          ? paypalCapture.onRequestGet
          : paypalCapture.onRequest,
        request,
        env,
        ctx,
      );
    }

    if (pathname === "/api/paypal/webhook") {
      return runPagesHandler(
        request.method === "POST"
          ? paypalWebhook.onRequestPost
          : paypalWebhook.onRequest,
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
