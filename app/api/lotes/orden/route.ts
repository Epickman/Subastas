import { NextResponse } from "next/server";
import { reordenarLotes } from "@/lib/lotes";
import { esAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Body: { ids: number[] } con todos los lotes en el orden nuevo.
export async function PUT(request: Request) {
  try {
    if (!(await esAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { ids } = await request.json();
    if (!Array.isArray(ids) || !ids.every(Number.isInteger)) {
      return NextResponse.json({ error: "Lista de ids inválida" }, { status: 400 });
    }
    await reordenarLotes(ids);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error al reordenar lotes", e);
    return NextResponse.json({ error: "Error al reordenar lotes" }, { status: 500 });
  }
}
