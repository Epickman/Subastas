import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

const EXTENSIONES = ["jpg", "jpeg", "png", "webp", "gif"];

export async function POST(request: Request) {
  try {
    // Cast: los tipos de @types/node pisan el FormData del DOM y ocultan .get().
    const formData = (await request.formData()) as unknown as { get(name: string): unknown };
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    if (!EXTENSIONES.includes(ext)) {
      return NextResponse.json({ error: "Formato de imagen no soportado" }, { status: 400 });
    }

    const blob = await put(`lotes/${crypto.randomUUID()}.${ext}`, file, {
      access: "public",
      contentType: file.type || undefined,
    });

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("Error al subir imagen", e);
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
  }
}
