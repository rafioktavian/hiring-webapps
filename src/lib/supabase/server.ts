import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Define a local interface to match the expected ReadonlyRequestCookies structure
interface CustomReadonlyRequestCookies {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: CookieOptions): void;
  remove(name: string, options: CookieOptions): void;
}

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL! || "YOUR_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || "YOUR_SUPABASE_ANON_KEY",
    {
      cookies: {
        get(name: string) {
          return (cookies() as unknown as CustomReadonlyRequestCookies).get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            (cookies() as unknown as CustomReadonlyRequestCookies).set(name, value, options)
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            (cookies() as unknown as CustomReadonlyRequestCookies).set(name, '', options)
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
