import { createBrowserClient } from "@supabase/ssr";

// Fall back to the main Supabase project until a dedicated chatbase project is
// provisioned and its NEXT_PUBLIC_CHATBASE_* env vars are set in Vercel.
const CHATBASE_URL =
  process.env.NEXT_PUBLIC_CHATBASE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://placeholder.supabase.co";
const CHATBASE_ANON_KEY =
  process.env.NEXT_PUBLIC_CHATBASE_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "placeholder-anon-key";

export function createChatbaseBrowserClient() {
  return createBrowserClient(CHATBASE_URL, CHATBASE_ANON_KEY);
}
