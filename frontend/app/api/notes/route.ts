import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { isValidChapterVerse, parseIntSafe, MAX_NOTE_LENGTH } from "@/lib/validation";

// GET - Fetch note for a specific verse (or all notes)
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const chapter = searchParams.get("chapter");
    const verse = searchParams.get("verse");

    if (chapter && verse) {
      const ch = parseIntSafe(chapter);
      const v = parseIntSafe(verse);
      if (isNaN(ch) || isNaN(v) || !isValidChapterVerse(ch, v)) {
        return NextResponse.json({ error: "Invalid chapter or verse" }, { status: 400 });
      }

      // Fetch specific note
      const { data, error } = await supabase
        .from("verse_notes")
        .select("*")
        .eq("user_id", userId)
        .eq("chapter", ch)
        .eq("verse", v)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is fine
        console.error("Error fetching note:", error);
        return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
      }

      return NextResponse.json(data || null);
    } else {
      // Fetch all notes for user
      const { data, error } = await supabase
        .from("verse_notes")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching notes:", error);
        return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
      }

      return NextResponse.json(data || []);
    }
  } catch (error) {
    console.error("Notes GET error:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

// POST - Create or update a note
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await req.json();
    const { chapter, verse, note_text } = body;

    if (!chapter || !verse || typeof note_text !== "string") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!isValidChapterVerse(chapter, verse)) {
      return NextResponse.json({ error: "Invalid chapter or verse" }, { status: 400 });
    }

    if (note_text.trim().length > MAX_NOTE_LENGTH) {
      return NextResponse.json({ error: "Note text too long" }, { status: 400 });
    }

    // Upsert the note (insert or update if exists)
    const { data, error } = await supabase
      .from("verse_notes")
      .upsert(
        {
          user_id: userId,
          chapter,
          verse,
          note_text: note_text.trim(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,chapter,verse",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving note:", error);
      return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Notes POST error:", error);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}

// DELETE - Remove a note
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const ch = parseIntSafe(searchParams.get("chapter"));
    const v = parseIntSafe(searchParams.get("verse"));

    if (isNaN(ch) || isNaN(v) || !isValidChapterVerse(ch, v)) {
      return NextResponse.json({ error: "Invalid chapter or verse" }, { status: 400 });
    }

    const { error } = await supabase
      .from("verse_notes")
      .delete()
      .eq("user_id", userId)
      .eq("chapter", ch)
      .eq("verse", v);

    if (error) {
      console.error("Error deleting note:", error);
      return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notes DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
