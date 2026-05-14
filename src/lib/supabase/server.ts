import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { CookieOptions } from "@supabase/ssr";

// GoTrue standalone serves at /signup, /token, etc.
// But @supabase/supabase-js always appends /auth/v1 to the base URL.
// Rewrite /auth/v1/* → /* so requests reach GoTrue correctly.
function rewriteFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const rewritten = url.replace(/\/auth\/v1\//, "/");
  return fetch(rewritten, init);
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
      global: {
        fetch: rewriteFetch,
      },
    },
  );
}
