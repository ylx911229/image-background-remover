"use client";

interface ImageComparisonProps {
  originalImage: string;
  processedImage: string | null;
  isProcessing: boolean;
  error: string | null;
  onReset: () => void;
}

export default function ImageComparison({
  originalImage,
  processedImage,
  isProcessing,
  error,
  onReset,
}: ImageComparisonProps) {
  const handleDownload = () => {
    if (!processedImage) return;

    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `removed-bg-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Image Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Original Image */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">原图</h3>
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={originalImage}
              alt="Original"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Processed Image */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            处理结果
          </h3>
          <div
            className="relative aspect-square rounded-lg overflow-hidden"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            }}
          >
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-700 font-medium">AI 正在处理中...</p>
                  <p className="text-sm text-gray-500 mt-2">预计 3-5 秒</p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                <div className="text-center p-6">
                  <div className="text-4xl mb-4">❌</div>
                  <p className="text-red-600 font-medium">{error}</p>
                </div>
              </div>
            )}
            {processedImage && !isProcessing && (
              <img
                src={processedImage}
                alt="Processed"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onReset}
          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          处理新图片
        </button>
        {processedImage && !isProcessing && (
          <button
            onClick={handleDownload}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            下载图片
          </button>
        )}
      </div>
    </div>
  );
}
