"use client";

import { Download } from "lucide-react";

interface DownloadPngButtonProps {
  imageUrl: string;
  chapter: number;
  verse: number;
}

export function DownloadPngButton({ imageUrl, chapter, verse }: DownloadPngButtonProps) {
  const handleDownload = async () => {
    try {
      // Load image and convert to PNG
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");
      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) throw new Error("Could not create PNG blob");

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gita-${chapter}-${verse}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 bg-saffron px-6 py-2.5 font-sans text-sm font-medium tracking-wide text-white transition-opacity hover:opacity-90"
    >
      <Download className="h-4 w-4" />
      Download
    </button>
  );
}
