import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { generateImage, buildPrompt, hashPrompt } from "@/lib/replicate";
import { isValidChapterVerse, parseIntSafe, MAX_TEXT_LENGTH } from "@/lib/validation";

// Stricter rate limit for image generation: 5 per hour
const RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in to generate images" }, { status: 401 });
    }

    const clientId = getClientId(req);
    const rateLimitResult = rateLimit(`generate-image:${userId}:${clientId}`, RATE_LIMIT);
    if (!rateLimitResult.success) {
      const minutesRemaining = Math.ceil(rateLimitResult.resetIn / 60000);
      return NextResponse.json(
        { error: `Rate limit reached. Try again in ${minutesRemaining} minutes.` },
        { status: 429 }
      );
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await req.json();
    const { chapter, verse, translation } = body;

    if (!chapter || !verse || !translation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!isValidChapterVerse(chapter, verse)) {
      return NextResponse.json({ error: "Invalid chapter or verse" }, { status: 400 });
    }

    if (typeof translation !== "string" || translation.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Invalid translation text" }, { status: 400 });
    }

    // Build prompt and check cache
    const prompt = buildPrompt(translation);
    const promptHash = hashPrompt(prompt);

    // Check if we already have this image cached
    const { data: existingImage } = await supabase
      .from("verse_images")
      .select("*")
      .eq("chapter", chapter)
      .eq("verse", verse)
      .eq("prompt_hash", promptHash)
      .single();

    if (existingImage) {
      // Return cached image
      return NextResponse.json({
        imageUrl: existingImage.image_url,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/image/${existingImage.id}`,
        cached: true,
      });
    }

    // Generate new image
    const replicateImageUrl = await generateImage(prompt);

    // Download the image from Replicate with timeout
    const downloadController = new AbortController();
    const downloadTimeout = setTimeout(() => downloadController.abort(), 30000);
    let imageResponse: Response;
    try {
      imageResponse = await fetch(replicateImageUrl, { signal: downloadController.signal });
    } finally {
      clearTimeout(downloadTimeout);
    }
    if (!imageResponse.ok) {
      throw new Error("Failed to download generated image");
    }
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // Upload to Supabase Storage
    const storagePath = `verse-images/${chapter}-${verse}-${promptHash}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("verse-images")
      .upload(storagePath, imageBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error("Failed to store image");
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from("verse-images")
      .getPublicUrl(storagePath);

    const publicImageUrl = publicUrlData.publicUrl;

    // Save metadata to database
    const { data: savedImage, error: insertError } = await supabase
      .from("verse_images")
      .insert({
        chapter,
        verse,
        image_url: publicImageUrl,
        storage_path: storagePath,
        prompt_hash: promptHash,
        user_id: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw new Error("Failed to save image metadata");
    }

    return NextResponse.json({
      imageUrl: publicImageUrl,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/image/${savedImage.id}`,
      cached: false,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET endpoint to fetch existing image for a verse
export async function GET(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const chapter = parseIntSafe(searchParams.get("chapter"));
    const verse = parseIntSafe(searchParams.get("verse"));

    if (isNaN(chapter) || isNaN(verse) || !isValidChapterVerse(chapter, verse)) {
      return NextResponse.json({ error: "Invalid chapter or verse" }, { status: 400 });
    }

    // Get the most recent image for this verse
    const { data: existingImage } = await supabase
      .from("verse_images")
      .select("*")
      .eq("chapter", chapter)
      .eq("verse", verse)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!existingImage) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      imageUrl: existingImage.image_url,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/image/${existingImage.id}`,
    });
  } catch {
    return NextResponse.json({ error: "Failed to check for existing image" }, { status: 500 });
  }
}
