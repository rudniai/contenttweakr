import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createChatbaseServerClient() {
  const cookieStore = cookies();

  // Fall back to the main Supabase project until a dedicated chatbase project is
  // provisioned and its NEXT_PUBLIC_CHATBASE_* env vars are set in Vercel.
  const url =
    process.env.NEXT_PUBLIC_CHATBASE_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "https://placeholder.supabase.co";
  const anonKey =
    process.env.NEXT_PUBLIC_CHATBASE_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "placeholder-anon-key";

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — middleware handles session refresh.
          }
        },
      },
    }
  );
}
