/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabase, VerseImage } from "@/lib/supabase";
import Link from "next/link";
import { DownloadPngButton } from "./DownloadPngButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getImage(id: string): Promise<VerseImage | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("verse_images")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const image = await getImage(id);

  if (!image) {
    return { title: "Image Not Found - GitaChat" };
  }

  return {
    title: `Bhagavad Gita ${image.chapter}:${image.verse} - Visualization - GitaChat`,
    description: `Anime visualization of Bhagavad Gita Chapter ${image.chapter}, Verse ${image.verse}`,
    openGraph: {
      title: `Bhagavad Gita ${image.chapter}:${image.verse} Visualization`,
      description: `Anime-style illustration inspired by the Bhagavad Gita`,
      images: [
        {
          url: image.image_url,
          width: 1280,
          height: 720,
          alt: `Bhagavad Gita Chapter ${image.chapter}, Verse ${image.verse}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Bhagavad Gita ${image.chapter}:${image.verse} Visualization`,
      description: `Anime-style illustration inspired by the Bhagavad Gita`,
      images: [image.image_url],
    },
  };
}

export default async function ImagePage({ params }: PageProps) {
  const { id } = await params;
  const image = await getImage(id);

  if (!image) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 pt-12 sm:px-10 sm:pt-16 md:px-12">
        {/* Back link */}
        <Link
          href={`/verse/${image.chapter}/${image.verse}`}
          className="mb-8 inline-block font-sans text-sm tracking-wide text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          ← View verse
        </Link>

        {/* Chapter/Verse badge */}
        <div className="mb-6 inline-block self-start bg-saffron-light px-4 py-2">
          <span className="font-sans text-sm font-medium tracking-wide text-saffron">
            Chapter {image.chapter}, Verse {image.verse}
          </span>
        </div>

        {/* Image */}
        <div className="overflow-hidden rounded-lg bg-black/20">
          <img
            src={image.image_url}
            alt={`Bhagavad Gita Chapter ${image.chapter}, Verse ${image.verse} - Anime Visualization`}
            className="h-auto w-full object-contain"
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-4">
          <DownloadPngButton
            imageUrl={image.image_url}
            chapter={image.chapter}
            verse={image.verse}
          />
          <Link
            href={`/verse/${image.chapter}/${image.verse}`}
            className="border border-border/40 px-6 py-2.5 font-sans text-sm tracking-wide text-muted-foreground/80 transition-colors hover:border-saffron/40 hover:text-foreground"
          >
            Read Verse
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-auto pb-8 pt-20">
          <div className="mb-6 h-px w-12 bg-border/20" />
          <p className="font-sans text-xs tracking-wider text-muted-foreground/40">
            Created with GitaChat
          </p>
        </footer>
      </div>
    </div>
  );
}
