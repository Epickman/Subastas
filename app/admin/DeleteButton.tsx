"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({ id, nombre }: { id: number; nombre: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`/api/lotes/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "#e06060" }}>¿Eliminar?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
          style={{ backgroundColor: "rgba(224,96,96,0.15)", color: "#e06060" }}
        >
          {loading ? "..." : "Sí"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ color: "#8a8080" }}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="btn-danger px-3 py-1.5 rounded-lg text-xs font-medium"
      title={`Eliminar ${nombre}`}
    >
      Eliminar
    </button>
  );
}
