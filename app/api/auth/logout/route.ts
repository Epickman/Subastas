import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  // Redirige al login del mismo dominio desde el que se cerró sesión.
  // 303 hace que el navegador pida la página con GET y no repita el POST.
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
