import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
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
