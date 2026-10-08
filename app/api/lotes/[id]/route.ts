import { NextResponse } from "next/server";
import { getLoteById, updateLote, deleteLote } from "@/lib/lotes";
import { toGaleria } from "@/lib/media";
import { esAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: RouteContext<"/api/lotes/[id]">) {
  const { id } = await ctx.params;
  const lote = await getLoteById(Number(id));
  if (!lote) return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
  return NextResponse.json(lote);
}

export async function PUT(request: Request, ctx: RouteContext<"/api/lotes/[id]">) {
  try {
    if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await ctx.params;
    const body = await request.json();
    const { nombre, descripcion, imagen, galeria, estado, ganador, precio_final, precio_base } = body;

    const lote = await updateLote(Number(id), {
      ...(nombre !== undefined && { nombre: String(nombre) }),
      ...(descripcion !== undefined && { descripcion: String(descripcion) }),
      ...(imagen !== undefined && { imagen: String(imagen) }),
      ...(galeria !== undefined && { galeria: toGaleria(galeria) }),
      ...(estado !== undefined && { estado }),
      ...(ganador !== undefined && { ganador: String(ganador) }),
      ...(precio_final !== undefined && { precio_final: Number(precio_final) }),
      ...(precio_base !== undefined && { precio_base: Number(precio_base) }),
    });

    if (!lote) return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
    return NextResponse.json(lote);
  } catch (e) {
    return NextResponse.json({ error: "Error al actualizar lote" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/lotes/[id]">) {
  try {
    if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await ctx.params;
    await deleteLote(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Error al eliminar lote" }, { status: 500 });
  }
}
