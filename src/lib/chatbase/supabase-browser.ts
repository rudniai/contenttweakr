import { createBrowserClient } from "@supabase/ssr";

// Fallback values allow the build to complete when env vars are not yet set.
// Auth operations will fail gracefully at runtime until real values are configured.
const CHATBASE_URL =
  process.env.NEXT_PUBLIC_CHATBASE_SUPABASE_URL ?? "https://placeholder.supabase.co";
const CHATBASE_ANON_KEY =
  process.env.NEXT_PUBLIC_CHATBASE_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export function createChatbaseBrowserClient() {
  return createBrowserClient(CHATBASE_URL, CHATBASE_ANON_KEY);
}
