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

export interface EmailSubscriber {
  id: string;
  user_id: string;
  email: string;
  timezone: string;
  unsubscribe_token: string;
  is_active: boolean;
  last_email_sent_at: string | null;
  subscribed_at: string;
  created_at: string;
}

export interface VerseImage {
  id: string;
  chapter: number;
  verse: number;
  image_url: string;
  storage_path: string;
  prompt_hash: string;
  user_id: string | null;
  created_at: string;
}
