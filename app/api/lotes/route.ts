import { NextResponse } from "next/server";
import { getAllLotes, createLote } from "@/lib/lotes";
import { toGaleria } from "@/lib/media";
import { esAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const lotes = await getAllLotes();
    return NextResponse.json(lotes);
  } catch (e) {
    return NextResponse.json({ error: "Error al obtener lotes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const body = await request.json();
    const { nombre, descripcion, imagen, galeria, estado, ganador, precio_final, precio_base } = body;

    if (!nombre || !estado) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    const lote = await createLote({
      nombre: String(nombre),
      descripcion: String(descripcion ?? ""),
      imagen: String(imagen ?? ""),
      galeria: toGaleria(galeria),
      estado,
      ganador: String(ganador ?? ""),
      precio_final: Number(precio_final ?? 0),
      precio_base: Number(precio_base ?? 0),
    });

    return NextResponse.json(lote, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Error al crear lote" }, { status: 500 });
  }
}
