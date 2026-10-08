"use client";

import { useRef, useState, type ReactNode } from "react";

// El contenido de cada fila lo arma la página (server); acá solo se maneja el arrastre.
type Fila = { id: number; nombre: string; contenido: ReactNode };

// Lista del admin: se reordena arrastrando la manija (mouse o touch) y el orden
// nuevo se guarda al soltar.
export default function ListaLotes({ filas: inicial }: { filas: Fila[] }) {
  const [items, setItems] = useState(inicial);
  const [arrastrando, setArrastrando] = useState<number | null>(null);
  const [estado, setEstado] = useState<"" | "guardando" | "guardado" | "error">("");
  const filas = useRef(new Map<number, HTMLDivElement>());
  const ordenInicial = useRef<Fila[]>([]);

  function empezar(e: React.PointerEvent, id: number) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    ordenInicial.current = items;
    setArrastrando(id);
  }

  function mover(e: React.PointerEvent) {
    if (arrastrando === null) return;
    // Posición destino: cantidad de filas (sin contar la arrastrada) cuyo centro queda arriba del puntero.
    const otras = items.filter(f => f.id !== arrastrando);
    const destino = otras.filter(f => {
      const r = filas.current.get(f.id)?.getBoundingClientRect();
      return r && r.top + r.height / 2 < e.clientY;
    }).length;
    const desde = items.findIndex(f => f.id === arrastrando);
    if (destino === desde) return;
    const nuevo = [...otras];
    nuevo.splice(destino, 0, items[desde]);
    setItems(nuevo);
  }

  async function soltar() {
    if (arrastrando === null) return;
    setArrastrando(null);
    const anterior = ordenInicial.current;
    if (anterior.every((f, i) => f.id === items[i].id)) return;

    setEstado("guardando");
    try {
      const res = await fetch("/api/lotes/orden", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: items.map(f => f.id) }),
      });
      if (!res.ok) throw new Error();
      setEstado("guardado");
    } catch {
      setItems(anterior);
      setEstado("error");
    }
  }

  return (
    <div>
      <p className="text-xs mb-3 h-4" style={{ color: estado === "error" ? "#e06060" : "#6a6060" }}>
        {estado === "guardando" && "Guardando orden..."}
        {estado === "guardado" && "Orden guardado."}
        {estado === "error" && "No se pudo guardar el orden. Probá de nuevo."}
        {estado === "" && "Arrastrá ⠿ para cambiar el orden en que se muestran los lotes."}
      </p>
      <div className="flex flex-col gap-3">
        {items.map(fila => {
          const activa = arrastrando === fila.id;
          return (
            <div
              key={fila.id}
              ref={el => {
                if (el) filas.current.set(fila.id, el);
                else filas.current.delete(fila.id);
              }}
              className="flex items-center gap-3 sm:gap-4 p-4 rounded-xl border transition-shadow"
              style={{
                backgroundColor: activa ? "#1a1712" : "#111111",
                borderColor: activa ? "rgba(200,169,110,0.5)" : "rgba(255,255,255,0.07)",
                boxShadow: activa ? "0 8px 24px rgba(0,0,0,0.5)" : undefined,
              }}
            >
              {/* Manija para arrastrar */}
              <button
                type="button"
                aria-label={`Mover ${fila.nombre}`}
                onPointerDown={e => empezar(e, fila.id)}
                onPointerMove={mover}
                onPointerUp={soltar}
                onPointerCancel={soltar}
                className="shrink-0 -ml-1 px-1 py-3 text-lg leading-none select-none"
                style={{ touchAction: "none", cursor: activa ? "grabbing" : "grab", color: activa ? "#c8a96e" : "#5a5050" }}
              >
                ⠿
              </button>

              {fila.contenido}
            </div>
          );
        })}
      </div>
    </div>
  );
}
