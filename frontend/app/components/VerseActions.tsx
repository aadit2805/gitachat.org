"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { LotusIcon } from "./LotusIcon";
import { ImageModal } from "./ImageModal";
import { VerseNote } from "./VerseNote";
import { Sparkles } from "lucide-react";

interface VerseActionsProps {
  chapter: number;
  verse: number;
  translation: string;
  summarized_commentary: string;
}

interface Bookmark {
  chapter: number;
  verse: number;
}

interface GeneratedImage {
  imageUrl: string;
  shareUrl: string;
  cached: boolean;
}

async function fetchBookmarks(): Promise<Bookmark[]> {
  const res = await fetch("/api/bookmarks");
  if (!res.ok) return [];
  return res.json();
}

async function generateVerseImage(data: { chapter: number; verse: number; translation: string }): Promise<GeneratedImage> {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to generate image");
  return result;
}

export function VerseActions({ chapter, verse, translation, summarized_commentary }: VerseActionsProps) {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);

  const { data: bookmarks } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: fetchBookmarks,
    enabled: isSignedIn,
    staleTime: 30 * 1000,
  });

  const isBookmarked = bookmarks?.some((b) => b.chapter === chapter && b.verse === verse);

  const addBookmark = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapter, verse, translation, summarized_commentary }),
      });
      if (!res.ok) throw new Error("Failed to bookmark");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  const removeBookmark = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bookmarks?chapter=${chapter}&verse=${verse}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  const handleBookmark = () => {
    if (isBookmarked) {
      removeBookmark.mutate();
    } else {
      addBookmark.mutate();
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/verse/${chapter}/${verse}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const imageGeneration = useMutation({
    mutationFn: () => generateVerseImage({ chapter, verse, translation }),
    onSuccess: (data) => {
      setGeneratedImage(data);
      setShowImageModal(true);
    },
  });

  const handleVisualize = () => {
    if (generatedImage) {
      // If we already have an image, just show it
      setShowImageModal(true);
    } else {
      // Generate a new image
      imageGeneration.mutate();
    }
  };

  const isPending = addBookmark.isPending || removeBookmark.isPending;

  return (
    <>
      <div className="flex items-center gap-4">
        {isSignedIn && (
          <>
            <button
              onClick={handleBookmark}
              disabled={isPending}
              className={`transition-colors disabled:opacity-50 ${
                isBookmarked
                  ? "text-saffron hover:text-saffron/70"
                  : "text-muted-foreground/40 hover:text-saffron"
              }`}
              title={isBookmarked ? "Remove from saved" : "Save verse"}
            >
              <LotusIcon filled={isBookmarked} className="h-5 w-5" />
            </button>
            <button
              onClick={handleVisualize}
              disabled={imageGeneration.isPending}
              className="flex items-center gap-1.5 font-sans text-xs tracking-wide text-muted-foreground/40 transition-colors hover:text-saffron disabled:opacity-50"
              title="Generate anime visualization"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {imageGeneration.isPending ? (
                <span className="animate-pulse">Creating...</span>
              ) : generatedImage ? (
                "View Image"
              ) : (
                "Visualize"
              )}
            </button>
            <VerseNote chapter={chapter} verse={verse} />
          </>
        )}
        <button
          onClick={handleShare}
          className="font-sans text-xs tracking-wide text-muted-foreground/40 transition-colors hover:text-saffron"
        >
          {copied ? "Copied!" : "Share"}
        </button>
      </div>

      {imageGeneration.error && (
        <p className="mt-2 font-sans text-xs text-red-400">
          {imageGeneration.error instanceof Error ? imageGeneration.error.message : "Failed to generate image"}
        </p>
      )}

      {generatedImage && (
        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          imageUrl={generatedImage.imageUrl}
          shareUrl={generatedImage.shareUrl}
          chapter={chapter}
          verse={verse}
        />
      )}
    </>
  );
}
