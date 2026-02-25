"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { PenLine, X, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import type { Note } from "@/lib/types";

interface VerseNoteProps {
  chapter: number;
  verse: number;
}

async function fetchNote(chapter: number, verse: number): Promise<Note | null> {
  const res = await fetch(`/api/notes?chapter=${chapter}&verse=${verse}`);
  if (!res.ok) return null;
  return res.json();
}

async function saveNote(data: { chapter: number; verse: number; note_text: string }): Promise<Note> {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save note");
  return res.json();
}

async function deleteNote(chapter: number, verse: number): Promise<void> {
  const res = await fetch(`/api/notes?chapter=${chapter}&verse=${verse}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete note");
}

export function VerseNote({ chapter, verse }: VerseNoteProps) {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: existingNote } = useQuery({
    queryKey: ["note", chapter, verse],
    queryFn: () => fetchNote(chapter, verse),
    enabled: isSignedIn,
  });

  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: saveNote,
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["note", chapter, verse] });
      setIsOpen(false);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to save note");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteNote(chapter, verse),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["note", chapter, verse] });
      setNoteText("");
      setIsOpen(false);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    },
  });

  useEffect(() => {
    if (existingNote?.note_text) {
      setNoteText(existingNote.note_text);
    }
  }, [existingNote]);

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

  if (!isSignedIn) return null;

  const handleSave = () => {
    if (!noteText.trim()) return;
    saveMutation.mutate({ chapter, verse, note_text: noteText });
  };

  const handleDelete = () => {
    if (confirm("Delete this note?")) {
      deleteMutation.mutate();
    }
  };

  const hasNote = !!existingNote?.note_text;

  const modal = isOpen && mounted ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-lg bg-[#1a1410] p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-sans text-sm font-medium tracking-wide text-foreground/80">
            Note for {chapter}:{verse}
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1.5 text-muted-foreground/60 transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Write your thoughts about this verse..."
          className="h-40 w-full resize-none rounded-lg border border-border/30 bg-black/30 p-3 font-sans text-sm leading-relaxed text-foreground/80 placeholder:text-muted-foreground/30 focus:border-saffron/50 focus:outline-none"
          autoFocus
        />

        {/* Error */}
        {error && (
          <p className="mt-2 font-sans text-xs text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            {hasNote && (
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5 font-sans text-xs text-red-400/70 transition-colors hover:text-red-400 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(false)}
              className="font-sans text-sm text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending || !noteText.trim()}
              className="rounded bg-saffron px-4 py-2 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 font-sans text-xs tracking-wide transition-colors ${
          hasNote
            ? "text-saffron/70 hover:text-saffron"
            : "text-muted-foreground/40 hover:text-saffron"
        }`}
        title={hasNote ? "Edit note" : "Add note"}
      >
        <PenLine className="h-3.5 w-3.5" />
        {hasNote ? "Note" : "Add Note"}
      </button>
      {modal}
    </>
  );
}
