"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface ImageUploaderProps {
  onUpload: (file: File) => void;
}

export default function ImageUploader({ onUpload }: ImageUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-4 border-dashed rounded-2xl p-20 text-center cursor-pointer
        transition-all duration-200
        ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-white hover:border-gray-400"
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        <div className="text-6xl">📸</div>
        {isDragActive ? (
          <p className="text-xl text-blue-600 font-medium">
            松开鼠标上传图片...
          </p>
        ) : (
          <>
            <p className="text-xl text-gray-700 font-medium">
              拖拽图片到这里，或点击选择
            </p>
            <p className="text-sm text-gray-500">
              支持 JPG、PNG、WEBP 格式，最大 10MB
            </p>
            <p className="text-xs text-gray-400">提示: 支持 Ctrl+V 粘贴</p>
          </>
        )}
      </div>
    </div>
  );
}
