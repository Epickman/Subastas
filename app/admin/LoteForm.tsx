"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import LoteMedia from "@/components/LoteMedia";
import type { Lote } from "@/lib/lotes";
import { EXT_IMAGEN, EXT_VIDEO, extension } from "@/lib/media";
import { quitarAudio } from "@/lib/quitarAudio";

type LoteFormProps = {
  initial?: Partial<Lote>;
  action: "create" | "edit";
  id?: number;
};

const ESTADOS = [
  { value: "pendiente", label: "Pendiente de subasta" },
  { value: "subastado", label: "Subastado" },
];

const FORMATOS = [...EXT_IMAGEN, ...EXT_VIDEO];

// Sube un archivo directo del navegador a Vercel Blob (a los videos les quita el audio antes).
async function subirArchivo(
  file: File,
  onProgreso: (pct: number) => void,
  onProcesando: (activo: boolean) => void,
): Promise<string> {
  const ext = extension(file.name);
  let archivo = file;
  if (EXT_VIDEO.includes(ext)) {
    onProcesando(true);
    try {
      archivo = await quitarAudio(file, ext);
    } catch (e) {
      console.error(e);
      throw new Error("No se pudo quitar el audio del video.");
    } finally {
      onProcesando(false);
    }
  }

  // Multipart para archivos grandes.
  const blob = await upload(`lotes/${crypto.randomUUID()}.${ext}`, archivo, {
    access: "public",
    handleUploadUrl: "/api/upload",
    contentType: archivo.type || undefined,
    multipart: archivo.size > 20 * 1024 * 1024,
    onUploadProgress: ({ percentage }) => onProgreso(Math.round(percentage)),
  });
  return blob.url;
}

function mensajeError(e: unknown): string {
  return e instanceof Error && e.message.startsWith("No se pudo") ? e.message : "Error al subir el archivo.";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#8a8080" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function LoteForm({ initial = {}, action, id }: LoteFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nombre: initial.nombre ?? "",
    descripcion: initial.descripcion ?? "",
    imagen: initial.imagen ?? "",
    estado: initial.estado ?? "pendiente",
    ganador: initial.ganador ?? "",
    precio_final: initial.precio_final ? String(initial.precio_final) : "",
    precio_base: initial.precio_base ? String(initial.precio_base) : "",
  });
  const [galeria, setGaleria] = useState<string[]>(initial.galeria ?? []);
  // Texto de estado mientras se suben archivos a la galería ("" = sin subidas).
  const [subiendoGaleria, setSubiendoGaleria] = useState("");
  const [imagePreview, setImagePreview] = useState(initial.imagen ?? "");
  const [previewEsVideo, setPreviewEsVideo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [procesando, setProcesando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  // Si se eligen varios archivos, el primero es la portada y el resto va a la galería.
  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const [file, ...resto] = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!file) return;

    const ext = extension(file.name);
    if (!FORMATOS.includes(ext)) {
      setError("Formato no soportado.");
      return;
    }

    setError("");
    setImagePreview(URL.createObjectURL(file));
    setPreviewEsVideo(EXT_VIDEO.includes(ext));
    setProgreso(0);
    setUploading(true);

    try {
      set("imagen", await subirArchivo(file, setProgreso, setProcesando));
    } catch (e) {
      setError(mensajeError(e));
      setImagePreview(form.imagen);
      setPreviewEsVideo(false);
    } finally {
      setUploading(false);
    }
    if (resto.length > 0) await subirAGaleria(resto);
  }

  async function handleGaleriaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError("");
    await subirAGaleria(files);
  }

  async function subirAGaleria(files: File[]) {
    const validos = files.filter(f => FORMATOS.includes(extension(f.name)));
    if (validos.length < files.length) setError("Algunos archivos tienen un formato no soportado y se omitieron.");

    // De a uno, para no saturar la conexión con videos grandes.
    for (const [i, file] of validos.entries()) {
      const prefijo = validos.length > 1 ? `${i + 1}/${validos.length} · ` : "";
      setSubiendoGaleria(`${prefijo}Subiendo... 0%`);
      try {
        const url = await subirArchivo(
          file,
          pct => setSubiendoGaleria(`${prefijo}Subiendo... ${pct}%`),
          activo => activo && setSubiendoGaleria(`${prefijo}Quitando audio...`),
        );
        setGaleria(g => [...g, url]);
      } catch (e) {
        setError(`${file.name}: ${mensajeError(e)}`);
      }
    }
    setSubiendoGaleria("");
  }

  function quitarDeGaleria(url: string) {
    setGaleria(g => g.filter(u => u !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      imagen: form.imagen,
      galeria,
      estado: form.estado,
      ganador: form.ganador.trim(),
      precio_final: form.precio_final ? Number(form.precio_final) : 0,
      precio_base: form.precio_base ? Number(form.precio_base) : 0,
    };

    try {
      const url = action === "create" ? "/api/lotes" : `/api/lotes/${id}`;
      const method = action === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al guardar");
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Error al guardar el lote.");
    } finally {
      setSaving(false);
    }
  }

  const showWinner = form.estado === "subastado";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-xl">
      {/* Nombre (el número de lote se asigna solo según la posición en la lista) */}
      <Field label="Nombre *">
        <input
          type="text"
          value={form.nombre}
          onChange={e => set("nombre", e.target.value)}
          required
          placeholder="Reloj de colección"
          className="input-field w-full px-4 py-3 rounded-lg text-sm"
        />
      </Field>

      {/* Description */}
      <Field label="Descripción">
        <textarea
          value={form.descripcion}
          onChange={e => set("descripcion", e.target.value)}
          rows={4}
          placeholder="Descripción del objeto..."
          className="input-field w-full px-4 py-3 rounded-lg text-sm resize-none"
        />
      </Field>

      {/* Image upload */}
      <Field label="Imagen o video principal">
        <div
          className="rounded-xl border-2 border-dashed cursor-pointer transition-colors"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
          onClick={() => fileRef.current?.click()}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(200,169,110,0.3)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
        >
          {imagePreview ? (
            <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
              {previewEsVideo ? (
                // Preview local (blob:) sin extensión: se fuerza como video.
                <video src={imagePreview} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <LoteMedia
                  src={imagePreview}
                  alt="Preview"
                  sizes="576px"
                  unoptimized={imagePreview.startsWith("blob:")}
                />
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                  <p className="text-sm" style={{ color: "#c8a96e" }}>{procesando ? "Quitando audio..." : `Subiendo... ${progreso}%`}</p>
                </div>
              )}
              <div
                className="absolute bottom-0 inset-x-0 py-3 text-xs text-center"
                style={{ backgroundColor: "rgba(0,0,0,0.65)", color: "#c8c0b8" }}
              >
                Clic para cambiar imagen o video
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ color: "rgba(255,255,255,0.15)" }}>
                <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="11" cy="13" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 22l8-8 6 6 4-4 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-sm" style={{ color: "#8a8080" }}>Clic para subir imágenes o videos</p>
              <p className="text-xs" style={{ color: "#5a5050" }}>Podés elegir varios: el primero queda como portada</p>
              <p className="text-xs" style={{ color: "#5a5050" }}>JPG, PNG, WebP · MP4, MOV, WebM</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleImageChange} className="hidden" />
      </Field>

      {/* Galería */}
      <Field label="Más imágenes o videos">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {galeria.map(url => (
            <div key={url} className="relative rounded-lg overflow-hidden" style={{ aspectRatio: "1", backgroundColor: "#0d0d0d" }}>
              <LoteMedia src={url} alt="" sizes="144px" />
              <button
                type="button"
                onClick={() => quitarDeGaleria(url)}
                aria-label="Quitar"
                className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "#f0ede8" }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => galeriaRef.current?.click()}
            disabled={!!subiendoGaleria}
            className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-2 text-center text-xs"
            style={{ aspectRatio: "1", borderColor: "rgba(255,255,255,0.1)", color: subiendoGaleria ? "#c8a96e" : "#8a8080" }}
          >
            {subiendoGaleria || (
              <>
                <span className="text-2xl leading-none">+</span>
                Agregar
              </>
            )}
          </button>
        </div>
        <input ref={galeriaRef} type="file" accept="image/*,video/*" multiple onChange={handleGaleriaChange} className="hidden" />
      </Field>

      {/* Precio base */}
      <Field label="Precio Base">
        <input
          type="number"
          value={form.precio_base}
          onChange={e => set("precio_base", e.target.value)}
          placeholder="500000"
          min="0"
          className="input-field w-full px-4 py-3 rounded-lg text-sm"
        />
      </Field>

      {/* Estado */}
      <Field label="Estado *">
        <select
          value={form.estado}
          onChange={e => set("estado", e.target.value)}
          className="input-field w-full px-4 py-3 rounded-lg text-sm appearance-none"
        >
          {ESTADOS.map(opt => (
            <option key={opt.value} value={opt.value} style={{ backgroundColor: "#111" }}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>

      {/* Winner + price (conditional) */}
      {showWinner && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Ganador">
            <input
              type="text"
              value={form.ganador}
              onChange={e => set("ganador", e.target.value)}
              placeholder="Juan Pérez"
              className="input-field w-full px-4 py-3 rounded-lg text-sm"
            />
          </Field>
          <Field label="Precio Final">
            <input
              type="number"
              value={form.precio_final}
              onChange={e => set("precio_final", e.target.value)}
              placeholder="750000"
              min="0"
              className="input-field w-full px-4 py-3 rounded-lg text-sm"
            />
          </Field>
        </div>
      )}

      {error && <p className="text-sm" style={{ color: "#e06060" }}>{error}</p>}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || uploading || !!subiendoGaleria}
          className="btn-gold px-6 py-3 rounded-lg text-sm font-semibold tracking-wider"
        >
          {saving ? "Guardando..." : action === "create" ? "Crear lote" : "Guardar cambios"}
        </button>
        <a href="/admin" className="link-gold px-6 py-3 rounded-lg text-sm font-medium">
          Cancelar
        </a>
      </div>
    </form>
  );
}
