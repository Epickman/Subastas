import { NextResponse } from "next/server";
import { getAllLotes, createLote } from "@/lib/lotes";

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
    const body = await request.json();
    const { numero_lote, nombre, descripcion, imagen, estado, ganador, precio_final } = body;

    if (!numero_lote || !nombre || !estado) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    const lote = await createLote({
      numero_lote: String(numero_lote),
      nombre: String(nombre),
      descripcion: String(descripcion ?? ""),
      imagen: String(imagen ?? ""),
      estado,
      ganador: String(ganador ?? ""),
      precio_final: Number(precio_final ?? 0),
    });

    return NextResponse.json(lote, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Error al crear lote" }, { status: 500 });
  }
}
