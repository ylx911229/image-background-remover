import { NextRequest, NextResponse } from "next/server";
import FormData from "form-data";
import axios from "axios";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  console.log("=== API 请求开始 ===");
  
  try {
    console.log("1. 解析 FormData...");
    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      console.log("错误: 未找到图片文件");
      return NextResponse.json(
        { error: "未找到图片文件" },
        { status: 400 }
      );
    }

    console.log(`2. 图片信息: ${image.name}, ${image.size} bytes, ${image.type}`);

    // 验证文件大小
    if (image.size > 10 * 1024 * 1024) {
      console.log("错误: 文件过大");
      return NextResponse.json(
        { error: "文件大小超过 10MB" },
        { status: 400 }
      );
    }

    // 检查 API Key
    const apiKey = process.env.REMOVEBG_API_KEY;
    console.log(`3. API Key 检查: ${apiKey ? '已配置' : '未配置'}`);
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Remove.bg API Key 未配置" },
        { status: 500 }
      );
    }

    // 转换为 Buffer
    console.log("4. 转换图片为 Buffer...");
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log(`   Buffer 大小: ${buffer.length} bytes`);

    // 创建 FormData
    console.log("5. 创建 FormData...");
    const form = new FormData();
    form.append("image_file", buffer, {
      filename: image.name,
      contentType: image.type,
    });
    form.append("size", "auto");

    // 调用 Remove.bg API
    console.log("6. 调用 Remove.bg API...");
    const startTime = Date.now();
    
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

    const duration = Date.now() - startTime;
    console.log(`7. API 响应成功 (耗时: ${duration}ms)`);
    console.log(`   响应大小: ${response.data.length} bytes`);

    // 转换为 base64
    console.log("8. 转换为 base64...");
    const base64Image = Buffer.from(response.data).toString("base64");
    const dataUrl = `data:image/png;base64,${base64Image}`;

    console.log("9. 处理完成，返回结果");
    console.log("=== API 请求结束 ===\n");

    return NextResponse.json({
      success: true,
      image: dataUrl,
    });
  } catch (error: any) {
    console.error("!!! 处理图片时出错 !!!");
    console.error("错误类型:", error.constructor.name);
    console.error("错误消息:", error.message);
    
    if (error.response) {
      console.error("API 响应状态:", error.response.status);
      console.error("API 响应数据:", error.response.data?.toString?.() || error.response.data);
    }
    
    if (error.code) {
      console.error("错误代码:", error.code);
    }
    
    console.error("完整错误:", error);
    console.log("=== API 请求结束（错误）===\n");

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
