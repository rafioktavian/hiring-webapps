import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  const redirectTo = requestUrl.origin + '/jobs' // Redirect to a specific page after login

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(redirectTo)
    }
  }

  // return the user to the redirecto url if there were any errors
  return NextResponse.redirect(redirectTo)
}
