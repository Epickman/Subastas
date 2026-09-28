import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'subasta2024';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'change-this-secret-in-production';

async function computeToken(password: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(password));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') return NextResponse.next();

  const token = request.cookies.get('admin_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const expected = await computeToken(ADMIN_PASSWORD, ADMIN_SECRET);
  if (token !== expected) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
