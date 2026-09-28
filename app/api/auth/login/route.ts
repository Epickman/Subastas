import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "subasta2024";
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "change-this-secret-in-production";

async function computeToken(password: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(password));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    const token = await computeToken(ADMIN_PASSWORD, ADMIN_SECRET);
    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
