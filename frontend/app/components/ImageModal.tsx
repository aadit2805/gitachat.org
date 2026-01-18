/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Download, Link, Check } from "lucide-react";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  shareUrl: string;
  chapter: number;
  verse: number;
}

export function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  shareUrl,
  chapter,
  verse,
}: ImageModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-4xl flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <span className="font-sans text-sm tracking-wide text-white/70">
            Chapter {chapter}, Verse {verse}
          </span>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Image */}
        <div className="relative overflow-hidden rounded-lg bg-black/50">
          <img
            src={imageUrl}
            alt={`Bhagavad Gita Chapter ${chapter}, Verse ${verse} - Anime Visualization`}
            className="h-auto w-full object-contain"
          />
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-full bg-saffron px-6 py-2.5 font-sans text-sm font-medium tracking-wide text-white transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 rounded-full border border-white/20 px-6 py-2.5 font-sans text-sm tracking-wide text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Link className="h-4 w-4" />
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
