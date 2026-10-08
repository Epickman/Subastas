import Link from "next/link";
import Image from "next/image";
import LoteMedia from "@/components/LoteMedia";
import { getAllLotes, formatPrecio, ESTADO_CONFIG, type Lote } from "@/lib/lotes";


export const dynamic = "force-dynamic";

export const metadata = {
  title: "Subasta — Resultados",
  description: "Conocé los resultados de nuestra subasta",
};

function StatusBadge({ estado }: { estado: Lote["estado"] }) {
  const cfg = ESTADO_CONFIG[estado];
  return (
    <span
      style={{ color: cfg.color, backgroundColor: cfg.bgColor }}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase"
    >
      <span style={{ backgroundColor: cfg.color }} className="w-1.5 h-1.5 rounded-full shrink-0" />
      {cfg.label}
    </span>
  );
}

function LoteCard({ lote, index }: { lote: Lote; index: number }) {
  const stagger = Math.min(index + 1, 6);
  return (
    <Link
      href={`/subasta/${lote.id}`}
      className={`group block animate-fadein stagger-${stagger}`}
      style={{ opacity: 0 }}
    >
      <article
        className="card-lote h-full rounded-2xl overflow-hidden border"
        style={{ backgroundColor: "#111111", borderColor: "rgba(255,255,255,0.07)" }}
      >
        {/* Image */}
        <div className="card-img relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: "#0d0d0d" }}>
          {lote.imagen ? (
            <LoteMedia
              src={lote.imagen}
              alt={lote.nombre}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span style={{ color: "rgba(255,255,255,0.08)", fontFamily: "var(--font-playfair)" }} className="text-6xl font-light">
                {lote.numero_lote}
              </span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span
              className="text-xs font-mono px-2.5 py-1 rounded-md tracking-widest"
              style={{ backgroundColor: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)", color: "#c8a96e" }}
            >
              LOTE #{lote.numero_lote}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          <h2
            style={{ fontFamily: "var(--font-playfair)", color: "#f0ede8" }}
            className="text-xl font-medium leading-tight line-clamp-2"
          >
            {lote.nombre}
          </h2>

          <StatusBadge estado={lote.estado} />

          {lote.estado === "subastado" ? (
            <div className="flex flex-col gap-3 pt-1">
              {lote.ganador && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#6a6060" }}>Ganador</p>
                  <p className="font-medium" style={{ color: "#d8d0c8" }}>{lote.ganador}</p>
                </div>
              )}
              {lote.precio_base > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#6a6060" }}>Precio Base</p>
                  <p className="text-sm font-medium" style={{ color: "#8a8080" }}>
                    {formatPrecio(lote.precio_base)}
                  </p>
                </div>
              )}
              {lote.precio_final > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#6a6060" }}>Precio Final</p>
                  <p className="text-xl font-semibold" style={{ color: "#c8a96e", fontFamily: "var(--font-playfair)" }}>
                    {formatPrecio(lote.precio_final)}
                  </p>
                </div>
              )}
            </div>
          ) : lote.precio_base > 0 ? (
            <div className="pt-1">
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#6a6060" }}>Precio Base</p>
              <p className="text-xl font-semibold" style={{ color: "#c8a96e", fontFamily: "var(--font-playfair)" }}>
                {formatPrecio(lote.precio_base)}
              </p>
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

export default async function SubastaPage() {
  const lotes = await getAllLotes();

  return (
    <main className="min-h-dvh px-4 py-12 sm:px-6 lg:px-8" style={{ backgroundColor: "#080808" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-14 animate-fadein" style={{ opacity: 0 }}>
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Logo Subasta"
              width={260}
              height={80}
              className="object-contain"
              style={{ maxHeight: 80 }}
              priority
            />
          </div>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-16" style={{ backgroundColor: "rgba(200,169,110,0.3)" }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#c8a96e" }} />
            <div className="h-px w-16" style={{ backgroundColor: "rgba(200,169,110,0.3)" }} />
          </div>
          <p className="text-base sm:text-lg" style={{ color: "#8a8080" }}>
            Conocé los lotes de nuestra subasta
          </p>
        </header>

        {/* Grid */}
        {lotes.length === 0 ? (
          <div
            className="text-center py-24 rounded-2xl border"
            style={{ borderColor: "rgba(255,255,255,0.07)", color: "#6a6060" }}
          >
            <p style={{ fontFamily: "var(--font-playfair)" }} className="text-2xl mb-3">Próximamente</p>
            <p className="text-sm">Los resultados estarán disponibles en breve.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {lotes.map((lote, i) => (
              <LoteCard key={lote.id} lote={lote} index={i} />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-xs" style={{ color: "rgba(122,120,120,0.5)" }}>
            {lotes.length} {lotes.length === 1 ? "lote" : "lotes"}
          </p>
        </footer>
      </div>
    </main>
  );
}
