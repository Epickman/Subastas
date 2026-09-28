"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError("Contraseña incorrecta.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-4" style={{ backgroundColor: "#080808" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: "#c8a96e" }}>
            Administración
          </p>
          <h1
            className="text-3xl font-light tracking-widest uppercase"
            style={{ fontFamily: "var(--font-playfair)", color: "#f0ede8" }}
          >
            Subasta
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-8"
          style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#8a8080" }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              className="input-field w-full px-4 py-3 rounded-lg text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm mb-4 text-center" style={{ color: "#e06060" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="btn-gold w-full py-3 rounded-lg text-sm font-semibold tracking-wider uppercase"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}
