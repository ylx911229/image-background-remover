import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

// Auth.js v5 正确用法：用 auth() 包裹 handler
export const GET = auth(async function GET(req) {
  const session = req.auth;

  if (!session?.user?.email) {
    return NextResponse.json({ credits: 0, loggedIn: false });
  }

  try {
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB as D1Database;

    const userId = session.user.email;

    await db.prepare(
      `INSERT OR IGNORE INTO user_credits (user_id, credits) VALUES (?, 3)`
    ).bind(userId).run();

    const row = await db.prepare(
      `SELECT credits, total_used FROM user_credits WHERE user_id = ?`
    ).bind(userId).first() as { credits: number; total_used: number } | null;

    return NextResponse.json({
      credits: row?.credits ?? 3,
      totalUsed: row?.total_used ?? 0,
      loggedIn: true,
    });
  } catch (error) {
    console.error("获取积分失败:", error);
    // D1 不可用时，返回默认 3 次
    return NextResponse.json({ credits: 3, loggedIn: true });
  }
}) as any;
