"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { esVideo } from "@/lib/media";
import VideoMudo from "./VideoMudo";

const SIZES = "(max-width: 768px) 100vw, 672px";

function Flecha({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={dir === "prev" ? "Anterior" : "Siguiente"}
      className={`absolute top-1/2 -translate-y-1/2 ${dir === "prev" ? "left-3" : "right-3"} z-10 flex h-10 w-10 items-center justify-center rounded-full`}
      style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#f0ede8" }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d={dir === "prev" ? "M10 12L6 8l4-4" : "M6 4l4 4-4 4"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// Detalle del lote: portada + galería. Las imágenes se ven completas (sin recorte)
// y al tocarlas se abren a pantalla completa; los videos se reproducen sin sonido.
export default function GaleriaLote({ items, alt }: { items: string[]; alt: string }) {
  const [actual, setActual] = useState(0);
  const [abierta, setAbierta] = useState(false);

  const src = items[actual];
  const varios = items.length > 1;
  const mover = (delta: number) => setActual(i => (i + delta + items.length) % items.length);

  useEffect(() => {
    if (!abierta) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierta(false);
      if (e.key === "ArrowLeft") mover(-1);
      if (e.key === "ArrowRight") mover(1);
    };
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta]);

  return (
    <div className="mb-8">
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ aspectRatio: "4/3", backgroundColor: "#0d0d0d" }}
      >
        {esVideo(src) ? (
          <VideoMudo key={src} src={src} />
        ) : (
          <button
            type="button"
            onClick={() => setAbierta(true)}
            aria-label="Ver imagen completa"
            className="absolute inset-0 w-full h-full cursor-zoom-in"
          >
            <Image src={src} alt={alt} fill className="object-contain" sizes={SIZES} priority={actual === 0} />
            <span
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#f0ede8" }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 2h4v4M6 14H2v-4M14 2l-5 5M2 14l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Ampliar
            </span>
          </button>
        )}
        {varios && (
          <>
            <Flecha dir="prev" onClick={() => mover(-1)} />
            <Flecha dir="next" onClick={() => mover(1)} />
            <span
              className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#f0ede8" }}
            >
              {actual + 1} / {items.length}
            </span>
          </>
        )}
      </div>

      {varios && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {items.map((item, i) => (
            <button
              key={item}
              type="button"
              onClick={() => setActual(i)}
              aria-label={`Ver ${i + 1} de ${items.length}`}
              className="relative h-16 w-20 shrink-0 rounded-lg overflow-hidden"
              style={{
                backgroundColor: "#0d0d0d",
                outline: i === actual ? "2px solid #c8a96e" : "1px solid rgba(255,255,255,0.1)",
                outlineOffset: i === actual ? "-2px" : "-1px",
                opacity: i === actual ? 1 : 0.6,
              }}
            >
              {esVideo(item) ? (
                <>
                  <video src={item} muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center" style={{ color: "#f0ede8" }}>
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3l8 5-8 5z"/></svg>
                  </span>
                </>
              ) : (
                <Image src={item} alt="" fill className="object-cover" sizes="80px" />
              )}
            </button>
          ))}
        </div>
      )}

      {abierta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setAbierta(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
        >
          <div className="relative w-full h-full">
            {esVideo(src) ? (
              // Click en el video no cierra (para poder usar los controles).
              <div className="absolute inset-0 cursor-default" onClick={e => e.stopPropagation()}>
                <VideoMudo key={src} src={src} />
              </div>
            ) : (
              <Image src={src} alt={alt} fill className="object-contain" sizes="100vw" />
            )}
          </div>
          {varios && (
            <>
              <Flecha dir="prev" onClick={() => mover(-1)} />
              <Flecha dir="next" onClick={() => mover(1)} />
            </>
          )}
          <button
            type="button"
            onClick={() => setAbierta(false)}
            aria-label="Cerrar"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#f0ede8" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
