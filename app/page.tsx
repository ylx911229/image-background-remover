"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import ImageComparison from "@/components/ImageComparison";

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setOriginalImage(URL.createObjectURL(file));
    setProcessedImage(null);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("处理失败，请重试");
      }

      const data = await response.json();
      setProcessedImage(data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : "处理失败");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI 一键去除图片背景
          </h1>
          <p className="text-xl text-gray-600">
            3 秒抠图，无需 PS，支持 4K 高清
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {!originalImage ? (
            <ImageUploader onUpload={handleUpload} />
          ) : (
            <ImageComparison
              originalImage={originalImage}
              processedImage={processedImage}
              isProcessing={isProcessing}
              error={error}
              onReset={handleReset}
            />
          )}
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold mb-2">电商产品图</h3>
            <p className="text-gray-600">快速制作白底图，提升商品展示效果</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">设计素材</h3>
            <p className="text-gray-600">提取人像做海报，创意设计更自由</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">社交头像</h3>
            <p className="text-gray-600">换背景色，让头像更有个性</p>
          </div>
        </div>
      </div>
    </main>
  );
}
