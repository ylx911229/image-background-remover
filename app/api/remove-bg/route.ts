import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
});

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

    // 转换为 base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const dataUrl = `data:${image.type};base64,${base64Image}`;

    // 调用 Replicate API
    const output = await replicate.run(
      "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
      {
        input: {
          image: dataUrl,
        },
      }
    );

    // 返回处理后的图片
    return NextResponse.json({
      success: true,
      image: output,
    });
  } catch (error) {
    console.error("处理图片时出错:", error);
    return NextResponse.json(
      { error: "处理失败，请稍后重试" },
      { status: 500 }
    );
  }
}
