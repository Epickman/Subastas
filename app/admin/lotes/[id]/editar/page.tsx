import { notFound } from "next/navigation";
import { getLoteById } from "@/lib/lotes";
import LoteForm from "@/app/admin/LoteForm";

export const dynamic = "force-dynamic";

export default async function EditarLotePage(props: PageProps<"/admin/lotes/[id]/editar">) {
  const { id } = await props.params;
  const lote = await getLoteById(Number(id));
  if (!lote) notFound();

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#c8a96e" }}>
          Lote #{lote.numero_lote}
        </p>
        <h1
          className="text-2xl font-medium"
          style={{ fontFamily: "var(--font-playfair)", color: "#f0ede8" }}
        >
          Editar lote
        </h1>
      </div>
      <LoteForm action="edit" id={lote.id} initial={lote} />
    </div>
  );
}
