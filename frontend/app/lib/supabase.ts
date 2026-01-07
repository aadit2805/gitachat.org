import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export interface QueryHistoryRecord {
  id: string;
  user_id: string;
  query: string;
  chapter: number;
  verse: number;
  translation: string;
  summarized_commentary: string;
  created_at: string;
}
