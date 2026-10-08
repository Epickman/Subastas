import { cookies } from 'next/headers';

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'subasta2024';
export const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'change-this-secret-in-production';

export async function computeToken(password: string, secret: string): Promise<string> {
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

export async function isAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  return token === (await computeToken(ADMIN_PASSWORD, ADMIN_SECRET));
}

// Para route handlers: true si la request trae la cookie de admin válida.
export async function esAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return isAdminToken(cookieStore.get('admin_token')?.value);
}
