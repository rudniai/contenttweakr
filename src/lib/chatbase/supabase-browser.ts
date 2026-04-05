import { createBrowserClient } from "@supabase/ssr";

export function createChatbaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_CHATBASE_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_CHATBASE_SUPABASE_ANON_KEY!
  );
}
