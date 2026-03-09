import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ImageMatte - AI 图片背景去除工具",
  description: "一键去除图片背景，3 秒完成人像抠图，无需 PS 技能",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
