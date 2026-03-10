"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import ImageComparison from "@/components/ImageComparison";
import { AuthButton } from "@/components/AuthButton";

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
      {/* 顶部导航 */}
      <nav className="w-full bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
        <span className="font-bold text-gray-800">🖼️ Image Background Remover</span>
        <AuthButton />
      </nav>

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
        <div className="max-w-4xl mx-auto">
          {!originalImage ? (
            <ImageUploader onUpload={handleUpload} />
          ) : (
            <div className="space-y-6">
              <ImageComparison
                originalImage={originalImage}
                processedImage={processedImage}
                isProcessing={isProcessing}
              />
              {error && (
                <div className="text-center text-red-500 bg-red-50 p-4 rounded-lg">
                  {error}
                </div>
              )}
              <div className="text-center">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  处理新图片
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
