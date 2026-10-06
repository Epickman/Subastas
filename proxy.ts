import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminToken } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') return NextResponse.next();

  if (!(await isAdminToken(request.cookies.get('admin_token')?.value))) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
