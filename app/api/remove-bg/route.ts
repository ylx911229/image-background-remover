import { NextRequest, NextResponse } from "next/server";
import FormData from "form-data";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json(
        { error: "未找到图片文件" },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "文件大小超过 10MB" },
        { status: 400 }
      );
    }

    // 检查 API Key
    const apiKey = process.env.REMOVEBG_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Remove.bg API Key 未配置" },
        { status: 500 }
      );
    }

    // 转换为 Buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 创建 FormData
    const form = new FormData();
    form.append("image_file", buffer, {
      filename: image.name,
      contentType: image.type,
    });
    form.append("size", "auto");

    // 调用 Remove.bg API
    const response = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "X-Api-Key": apiKey,
        },
        responseType: "arraybuffer",
        timeout: 30000, // 30 秒超时
      }
    );

    // 转换为 base64
    const base64Image = Buffer.from(response.data).toString("base64");
    const dataUrl = `data:image/png;base64,${base64Image}`;

    return NextResponse.json({
      success: true,
      image: dataUrl,
    });
  } catch (error: any) {
    console.error("处理图片时出错:", error);

    // 处理 Remove.bg 特定错误
    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        return NextResponse.json(
          { error: "API Key 无效或已过期" },
          { status: 403 }
        );
      } else if (status === 402) {
        return NextResponse.json(
          { error: "账户余额不足，请充值" },
          { status: 402 }
        );
      } else if (status === 429) {
        return NextResponse.json(
          { error: "请求过于频繁，请稍后重试" },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "处理失败，请稍后重试" },
      { status: 500 }
    );
  }
}
