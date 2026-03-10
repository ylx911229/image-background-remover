import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

export const POST = auth(async function POST(request: any) {
  // 1. 检查登录状态
  const session = request.auth;
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "LOGIN_REQUIRED", message: "请先登录后使用" },
      { status: 401 }
    );
  }

  try {
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB as D1Database;
    const apiKey = (ctx.env as any).REMOVEBG_API_KEY || process.env.REMOVEBG_API_KEY || "";
    const userId = session.user.email;

    // 2. 初始化新用户积分（送 3 次）
    await db.prepare(
      "INSERT OR IGNORE INTO user_credits (user_id, credits) VALUES (?, 3)"
    ).bind(userId).run();

    // 3. 检查积分
    const row = await db.prepare(
      "SELECT credits FROM user_credits WHERE user_id = ?"
    ).bind(userId).first() as { credits: number } | null;

    const currentCredits = row?.credits ?? 0;
    if (currentCredits <= 0) {
      return NextResponse.json(
        { error: "NO_CREDITS", message: "积分不足，请升级套餐" },
        { status: 402 }
      );
    }

    // 4. 获取图片
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    if (!imageFile) {
      return NextResponse.json(
        { error: "NO_IMAGE", message: "请上传图片" },
        { status: 400 }
      );
    }

    // 5. 调用 remove.bg API
    const removeBgForm = new FormData();
    removeBgForm.append("image_file", imageFile);
    removeBgForm.append("size", "auto");

    const bgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: removeBgForm,
    });

    if (!bgResponse.ok) {
      return NextResponse.json(
        { error: "API_ERROR", message: "图片处理失败，请重试" },
        { status: 500 }
      );
    }

    // 6. 扣除积分
    await db.prepare(
      "UPDATE user_credits SET credits = credits - 1, total_used = total_used + 1, updated_at = unixepoch() WHERE user_id = ?"
    ).bind(userId).run();

    // 7. 返回结果
    const buffer = await bgResponse.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${base64}`,
      creditsRemaining: currentCredits - 1,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "SERVER_ERROR", message: `处理失败: ${error.message}` },
      { status: 500 }
    );
  }
}) as any;
