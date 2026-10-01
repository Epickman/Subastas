import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLoteById, formatPrecio, ESTADO_CONFIG } from "@/lib/lotes";

export const dynamic = "force-dynamic";

export default async function LotePage(props: PageProps<"/subasta/[id]">) {
  const { id } = await props.params;
  const lote = await getLoteById(Number(id));
  if (!lote) notFound();

  const cfg = ESTADO_CONFIG[lote.estado];
  const showGanador = lote.estado === "adjudicado" || lote.estado === "subastado";

  return (
    <main className="min-h-dvh px-4 py-10 sm:px-6" style={{ backgroundColor: "#080808", color: "#f0ede8" }}>
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <Link href="/subasta" className="link-back mb-10 inline-flex">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver a la subasta
        </Link>

        {/* Lot number */}
        <p className="text-xs tracking-[0.35em] uppercase mb-3 mt-10" style={{ color: "#c8a96e" }}>
          Lote #{lote.numero_lote}
        </p>

        {/* Title */}
        <h1
          className="text-3xl sm:text-4xl font-medium mb-8 leading-tight"
          style={{ fontFamily: "var(--font-playfair)", color: "#f0ede8" }}
        >
          {lote.nombre}
        </h1>

        {/* Image */}
        {lote.imagen && (
          <div
            className="relative w-full rounded-2xl overflow-hidden mb-8"
            style={{ aspectRatio: "4/3", backgroundColor: "#0d0d0d" }}
          >
            <Image
              src={lote.imagen}
              alt={lote.nombre}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
          </div>
        )}

        {/* Description */}
        {lote.descripcion && (
          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#6a6060" }}>Descripción</p>
            <p className="text-base leading-relaxed" style={{ color: "#c8c0b8" }}>{lote.descripcion}</p>
          </div>
        )}

        {/* Divider */}
        <div className="h-px mb-8" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />

        {/* Status + Result */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
            <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
          </div>

          {showGanador ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {lote.ganador && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#6a6060" }}>Ganador</p>
                  <p className="text-xl font-medium" style={{ color: "#f0ede8" }}>{lote.ganador}</p>
                </div>
              )}
              {lote.precio_final > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#6a6060" }}>Precio Final</p>
                  <p className="text-2xl font-semibold" style={{ color: "#c8a96e", fontFamily: "var(--font-playfair)" }}>
                    {formatPrecio(lote.precio_final)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#8a8080" }}>Este lote no fue adjudicado.</p>
          )}
        </div>

        {/* Back button */}
        <div className="mt-10 text-center">
          <Link href="/subasta" className="btn-back-full">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver a la subasta
          </Link>
        </div>
      </div>
    </main>
  );
}
