import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const isChatbasePath = request.nextUrl.pathname.startsWith("/chat/dashboard");

  const supabaseUrl = isChatbasePath
    ? process.env.NEXT_PUBLIC_CHATBASE_SUPABASE_URL!
    : process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = isChatbasePath
    ? process.env.NEXT_PUBLIC_CHATBASE_SUPABASE_ANON_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    if (isChatbasePath) {
      url.pathname = "/chat/login";
    } else {
      url.pathname = "/fsa";
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
