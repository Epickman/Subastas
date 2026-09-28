import LoteForm from "@/app/admin/LoteForm";

export const metadata = {
  title: "Nuevo Lote — Admin",
};

export default function NuevoLotePage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#c8a96e" }}>
          Nuevo lote
        </p>
        <h1
          className="text-2xl font-medium"
          style={{ fontFamily: "var(--font-playfair)", color: "#f0ede8" }}
        >
          Agregar lote
        </h1>
      </div>
      <LoteForm action="create" />
    </div>
  );
}
