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

  const [form, setForm] = useState({
    numero_lote: initial.numero_lote ?? "",
    nombre: initial.nombre ?? "",
    descripcion: initial.descripcion ?? "",
    imagen: initial.imagen ?? "",
    estado: initial.estado ?? "pendiente",
    ganador: initial.ganador ?? "",
    precio_final: initial.precio_final ? String(initial.precio_final) : "",
    precio_base: initial.precio_base ? String(initial.precio_base) : "",
  });
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

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = extension(file.name);
    if (![...EXT_IMAGEN, ...EXT_VIDEO].includes(ext)) {
      setError("Formato no soportado.");
      return;
    }

    setError("");
    const video = EXT_VIDEO.includes(ext);
    setImagePreview(URL.createObjectURL(file));
    setPreviewEsVideo(video);
    setProgreso(0);
    setUploading(true);

    try {
      let archivo = file;
      if (video) {
        setProcesando(true);
        try {
          archivo = await quitarAudio(file, ext);
        } catch (e) {
          console.error(e);
          throw new Error("No se pudo quitar el audio del video.");
        } finally {
          setProcesando(false);
        }
      }

      // Subida directa del navegador a Vercel Blob; multipart para archivos grandes.
      const blob = await upload(`lotes/${crypto.randomUUID()}.${ext}`, archivo, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: archivo.type || undefined,
        multipart: archivo.size > 20 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgreso(Math.round(percentage)),
      });
      set("imagen", blob.url);
    } catch (e) {
      setError(e instanceof Error && e.message.startsWith("No se pudo") ? e.message : "Error al subir el archivo.");
      setImagePreview(form.imagen);
      setPreviewEsVideo(false);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      numero_lote: form.numero_lote.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      imagen: form.imagen,
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
      {/* Lote number + name */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Número de lote *">
          <input
            type="text"
            value={form.numero_lote}
            onChange={e => set("numero_lote", e.target.value)}
            required
            placeholder="01"
            className="input-field w-full px-4 py-3 rounded-lg text-sm"
          />
        </Field>
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
      </div>

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
      <Field label="Imagen o video">
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
              <p className="text-sm" style={{ color: "#8a8080" }}>Clic para subir imagen o video</p>
              <p className="text-xs" style={{ color: "#5a5050" }}>JPG, PNG, WebP · MP4, MOV, WebM</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleImageChange} className="hidden" />
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
          disabled={saving || uploading}
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
