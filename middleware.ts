import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );
  
  const { data: { session } } = await supabase.auth.getSession()
  const pathname = req.nextUrl.pathname

  // Protected routes for non-authenticated users
  if (!session && (pathname.startsWith('/admin') || pathname.startsWith('/super-admin') || pathname.startsWith('/jobs'))) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Role-based protection
  if(session) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
    const role = profile?.role

    if (pathname.startsWith('/super-admin') && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  
    if (pathname.startsWith('/admin') && !['admin','super_admin'].includes(role)) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  
    if ((pathname.startsWith('/jobs') || pathname.startsWith('/my-applications')) && role !== 'candidate') {
      if(role === 'super_admin') return NextResponse.redirect(new URL('/super-admin/dashboard', req.url));
      if(role === 'admin') return NextResponse.redirect(new URL('/admin', req.url));
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Redirect authenticated candidates to /jobs if they try to access the root path
    if (session && role === 'candidate' && pathname === '/') {
      return NextResponse.redirect(new URL('/jobs', req.url));
    }

    if (pathname === '/login' || pathname === '/register' || pathname === '/super-admin/login') {
        if (role === 'candidate') return NextResponse.redirect(new URL('/jobs', req.url));
        if (role === 'admin') return NextResponse.redirect(new URL('/admin', req.url));
        if (role === 'super_admin') return NextResponse.redirect(new URL('/super-admin/dashboard', req.url));
    }
  }


  return res;
}

export const config = {
    matcher: [
      '/admin/:path*',
      '/super-admin/:path*',
      '/jobs/:path*',
      '/my-applications/:path*',
      '/login',
      '/register'
    ],
  }
