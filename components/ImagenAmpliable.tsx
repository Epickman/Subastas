"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Imagen del detalle: se ve completa (sin recorte) y al tocarla se abre a pantalla completa.
export default function ImagenAmpliable({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    if (!abierta) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierta(false);
    };
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", onKey);
    };
  }, [abierta]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-label="Ver imagen completa"
        className="absolute inset-0 w-full h-full cursor-zoom-in group"
      >
        <Image src={src} alt={alt} fill className="object-contain" sizes={sizes} priority />
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
            <Image src={src} alt={alt} fill className="object-contain" sizes="100vw" />
          </div>
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
    </>
  );
}
