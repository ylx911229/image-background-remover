import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

// 将 ArrayBuffer 转换为 base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000; // 32KB chunks
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

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

    // 转换为 Blob
    console.log("4. 准备上传数据...");
    const imageBlob = await image.arrayBuffer();

    // 创建 FormData (使用原生 FormData)
    console.log("5. 创建 FormData...");
    const uploadFormData = new FormData();
    uploadFormData.append("image_file", new Blob([imageBlob], { type: image.type }), image.name);
    uploadFormData.append("size", "auto");

    // 调用 Remove.bg API
    console.log("6. 调用 Remove.bg API...");
    const startTime = Date.now();
    
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: uploadFormData,
    });

    const duration = Date.now() - startTime;
    console.log(`7. API 响应 (耗时: ${duration}ms, 状态: ${response.status})`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API 错误:", errorText);
      
      if (response.status === 403) {
        return NextResponse.json(
          { error: "API Key 无效或已过期" },
          { status: 403 }
        );
      } else if (response.status === 402) {
        return NextResponse.json(
          { error: "账户余额不足，请充值" },
          { status: 402 }
        );
      } else if (response.status === 429) {
        return NextResponse.json(
          { error: "请求过于频繁，请稍后重试" },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: `处理失败: ${errorText}` },
        { status: response.status }
      );
    }

    // 获取处理后的图片
    const resultBlob = await response.arrayBuffer();
    console.log(`8. 获取结果 (大小: ${resultBlob.byteLength} bytes)`);

    // 转换为 base64
    console.log("9. 转换为 base64...");
    const base64Image = arrayBufferToBase64(resultBlob);
    const dataUrl = `data:image/png;base64,${base64Image}`;

    console.log("10. 处理完成，返回结果");
    console.log("=== API 请求结束 ===\n");

    return NextResponse.json({
      success: true,
      image: dataUrl,
    });
  } catch (error: any) {
    console.error("!!! 处理图片时出错 !!!");
    console.error("错误类型:", error.constructor?.name);
    console.error("错误消息:", error.message);
    console.error("错误堆栈:", error.stack);
    console.log("=== API 请求结束（错误）===\n");

    return NextResponse.json(
      { error: `处理失败: ${error.message}` },
      { status: 500 }
    );
  }
}
