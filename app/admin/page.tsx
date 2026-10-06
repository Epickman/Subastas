import Link from "next/link";
import LoteMedia from "@/components/LoteMedia";
import { getAllLotes, formatPrecio, ESTADO_CONFIG } from "@/lib/lotes";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const lotes = await getAllLotes();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-medium"
            style={{ fontFamily: "var(--font-playfair)", color: "#f0ede8" }}
          >
            Lotes
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8a8080" }}>
            {lotes.length} {lotes.length === 1 ? "lote cargado" : "lotes cargados"}
          </p>
        </div>
        <Link
          href="/admin/lotes/nuevo"
          className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wider"
        >
          + Agregar lote
        </Link>
      </div>

      {lotes.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl border"
          style={{ borderColor: "rgba(255,255,255,0.07)", color: "#6a6060" }}
        >
          <p style={{ fontFamily: "var(--font-playfair)" }} className="text-xl mb-3">Sin lotes</p>
          <p className="text-sm mb-6">Comenzá agregando el primer lote.</p>
          <Link href="/admin/lotes/nuevo" className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold">
            + Agregar lote
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {lotes.map(lote => {
            const cfg = ESTADO_CONFIG[lote.estado];
            return (
              <div
                key={lote.id}
                className="flex items-center gap-4 p-4 rounded-xl border"
                style={{ backgroundColor: "#111111", borderColor: "rgba(255,255,255,0.07)" }}
              >
                {/* Thumbnail */}
                <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden" style={{ backgroundColor: "#0d0d0d" }}>
                  {lote.imagen ? (
                    <div className="relative w-full h-full">
                      <LoteMedia src={lote.imagen} alt={lote.nombre} sizes="56px" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "#3a3a3a" }}>
                      #{lote.numero_lote}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono" style={{ color: "#c8a96e" }}>#{lote.numero_lote}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ color: cfg.color, backgroundColor: cfg.bgColor }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className="font-medium truncate" style={{ color: "#f0ede8" }}>{lote.nombre}</p>
                  {lote.precio_base > 0 && (
                    <p className="text-sm truncate" style={{ color: "#8a8080" }}>
                      Base: {formatPrecio(lote.precio_base)}
                    </p>
                  )}
                  {lote.ganador && (
                    <p className="text-sm truncate" style={{ color: "#8a8080" }}>
                      {lote.ganador}{lote.precio_final > 0 ? ` · ${formatPrecio(lote.precio_final)}` : ""}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    href={`/admin/lotes/${lote.id}/editar`}
                    className="btn-admin-edit px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    Editar
                  </Link>
                  <DeleteButton id={lote.id} nombre={lote.nombre} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
