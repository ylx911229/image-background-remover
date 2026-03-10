"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import ImageUploader from "@/components/ImageUploader";
import ImageComparison from "@/components/ImageComparison";
import { AuthButton } from "@/components/AuthButton";
import UpgradeModal from "@/components/UpgradeModal";

export default function Home() {
  const { data: session, status } = useSession();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  // 获取积分
  useEffect(() => {
    if (session?.user) {
      fetch("/api/credits")
        .then(res => res.json())
        .then((data) => {
          const d = data as { credits?: number };
          if (d.credits !== undefined) {
            setCredits(d.credits);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const handleUpload = async (file: File) => {
    // 检查是否登录
    if (status !== "authenticated") {
      setError("请先登录后使用，注册即送 3 次免费额度");
      return;
    }

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
        const errorData = await response.json().catch(() => ({})) as { error?: string; message?: string };
        
        if (errorData.error === "LOGIN_REQUIRED") {
          setError("请先登录后使用，注册即送 3 次免费额度");
          return;
        }
        
        if (errorData.error === "NO_CREDITS") {
          setShowUpgradeModal(true);
          setError("积分不足");
          return;
        }
        
        throw new Error(errorData.message || "处理失败，请重试");
      }

      const data = await response.json() as { image: string; creditsRemaining?: number };
      setProcessedImage(data.image);
      
      // 更新剩余积分
      if (data.creditsRemaining !== undefined) {
        setCredits(data.creditsRemaining);
      }
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
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-blue-600 font-medium">
            Pricing
          </Link>
          {/* 积分显示 - 移到导航栏 */}
          {session?.user && credits !== null && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-700 text-sm">
              <span>✨</span>
              <span className="font-medium">{credits} 次</span>
            </div>
          )}
          <AuthButton />
        </div>
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
          
          {/* 未登录提示 */}
          {status === "unauthenticated" && (
            <div className="mt-4">
              <button
                onClick={() => signIn("google")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                <span>🎁</span>
                <span>登录免费领取 3 次额度</span>
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {!originalImage ? (
            <>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                  <p className="text-red-600 font-medium">{error}</p>
                  {error.includes("登录") && (
                    <button
                      onClick={() => signIn("google")}
                      className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      立即登录（注册送 3 次免费额度）
                    </button>
                  )}
                </div>
              )}
              <ImageUploader onUpload={handleUpload} />
            </>
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
      </div>

      {/* Pricing Preview */}
        <div className="mt-16 text-center pb-12">
          <p className="text-gray-500 mb-2">Need more?</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Pricing Plans →
          </Link>
        </div>
      </div>

      {/* 升级弹窗 */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </main>
  );
}
