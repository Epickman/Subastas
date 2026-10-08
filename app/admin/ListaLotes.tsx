"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

// El contenido de cada fila lo arma la página (server); acá solo se maneja el arrastre.
type Fila = { id: number; nombre: string; contenido: ReactNode };

// Lista del admin: se reordena arrastrando la manija (mouse o touch) y el orden
// nuevo se guarda al soltar.
export default function ListaLotes({ filas: inicial }: { filas: Fila[] }) {
  const router = useRouter();
  const [items, setItemsState] = useState(inicial);
  const [arrastrando, setArrastrandoState] = useState<number | null>(null);
  const [estado, setEstado] = useState<"" | "guardando" | "guardado" | "error">("");
  const filas = useRef(new Map<number, HTMLDivElement>());
  const ordenInicial = useRef<Fila[]>([]);
  // Copias en refs: los eventos de puntero llegan más rápido que los renders y
  // al soltar hay que guardar exactamente el orden que se ve en pantalla.
  const itemsRef = useRef(inicial);
  const arrastrandoRef = useRef<number | null>(null);

  // El orden sale del estado local y el contenido de cada fila de lo último que mandó
  // el servidor (números recalculados, lotes eliminados o agregados).
  const porId = new Map(inicial.map(f => [f.id, f]));
  const visibles = [
    ...items.filter(f => porId.has(f.id)).map(f => porId.get(f.id)!),
    ...inicial.filter(f => !items.some(i => i.id === f.id)),
  ];

  function setItems(nuevo: Fila[]) {
    itemsRef.current = nuevo;
    setItemsState(nuevo);
  }

  function setArrastrando(id: number | null) {
    arrastrandoRef.current = id;
    setArrastrandoState(id);
  }

  // Se escucha en window: al reordenar, React mueve la fila en el DOM y el navegador
  // le quita la captura del puntero a la manija, así que el "soltar" no le llegaría.
  function empezar(e: React.PointerEvent, id: number) {
    e.preventDefault();
    itemsRef.current = visibles;
    ordenInicial.current = visibles;
    setArrastrando(id);
    const fin = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", fin);
      window.removeEventListener("pointercancel", fin);
      soltar();
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", fin);
    window.addEventListener("pointercancel", fin);
  }

  function mover(e: PointerEvent) {
    const id = arrastrandoRef.current;
    if (id === null) return;
    const actuales = itemsRef.current;
    // Posición destino: cantidad de filas (sin contar la arrastrada) cuyo centro queda arriba del puntero.
    const otras = actuales.filter(f => f.id !== id);
    const destino = otras.filter(f => {
      const r = filas.current.get(f.id)?.getBoundingClientRect();
      return r && r.top + r.height / 2 < e.clientY;
    }).length;
    const desde = actuales.findIndex(f => f.id === id);
    if (destino === desde) return;
    const nuevo = [...otras];
    nuevo.splice(destino, 0, actuales[desde]);
    setItems(nuevo);
  }

  async function soltar() {
    if (arrastrandoRef.current === null) return;
    setArrastrando(null);
    const anterior = ordenInicial.current;
    const nuevo = itemsRef.current;
    if (anterior.every((f, i) => f.id === nuevo[i].id)) return;

    setEstado("guardando");
    try {
      const res = await fetch("/api/lotes/orden", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: nuevo.map(f => f.id) }),
      });
      if (!res.ok) throw new Error();
      setEstado("guardado");
      // Trae los números de lote recalculados según la posición.
      router.refresh();
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
        {estado === "" && "Arrastrá ⠿ para cambiar el orden. El número de lote se ajusta solo según la posición."}
      </p>
      <div className="flex flex-col gap-3">
        {visibles.map(fila => {
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
