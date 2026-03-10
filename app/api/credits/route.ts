import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ credits: 0, loggedIn: false });
  }

  try {
    let db: D1Database | null = null;
    try {
      const ctx = getRequestContext();
      db = (ctx.env as any).DB as D1Database;
    } catch (e) {
      // 本地开发模式
      return NextResponse.json({ credits: 999, totalUsed: 0, loggedIn: true });
    }

    if (!db) {
      return NextResponse.json({ credits: 999, totalUsed: 0, loggedIn: true });
    }

    const userId = session.user.email;

    // 新用户自动初始化 3 次
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
    return NextResponse.json({ credits: 0, loggedIn: true, error: true });
  }
}
