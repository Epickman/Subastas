import { getDb, NOW_LOCAL } from './db';

export type EstadoLote = 'adjudicado' | 'subastado' | 'sin_adjudicar';

export interface Lote {
  id: number;
  numero_lote: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  estado: EstadoLote;
  ganador: string;
  precio_final: number;
  created_at: string;
  updated_at: string;
}

export type LoteInput = {
  numero_lote: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  estado: EstadoLote;
  ganador: string;
  precio_final: number;
};

const COLUMNAS: (keyof LoteInput)[] = [
  'numero_lote', 'nombre', 'descripcion', 'imagen', 'estado', 'ganador', 'precio_final',
];

function toLote(row: Record<string, unknown>): Lote {
  return { ...(row as unknown as Lote), precio_final: Number(row.precio_final ?? 0) };
}

export async function getAllLotes(): Promise<Lote[]> {
  const db = await getDb();
  // Números de lote numéricos primero, en orden numérico; el resto alfabético.
  const rows = await db.query(`
    SELECT * FROM lotes
    ORDER BY CASE WHEN numero_lote ~ '^[0-9]+$' THEN numero_lote::numeric END ASC NULLS LAST,
             numero_lote ASC
  `);
  return rows.map(toLote);
}

export async function getLoteById(id: number): Promise<Lote | undefined> {
  if (!Number.isInteger(id)) return undefined;
  const db = await getDb();
  const rows = await db.query('SELECT * FROM lotes WHERE id = $1', [id]);
  return rows[0] ? toLote(rows[0]) : undefined;
}

export async function createLote(data: LoteInput): Promise<Lote> {
  const db = await getDb();
  const rows = await db.query(
    `INSERT INTO lotes (numero_lote, nombre, descripcion, imagen, estado, ganador, precio_final)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    COLUMNAS.map((c) => data[c]),
  );
  return toLote(rows[0]);
}

export async function updateLote(id: number, data: Partial<LoteInput>): Promise<Lote | undefined> {
  if (!Number.isInteger(id)) return undefined;
  const keys = COLUMNAS.filter((c) => data[c] !== undefined);
  if (keys.length === 0) return getLoteById(id);
  const db = await getDb();
  const sets = [...keys.map((k, i) => `${k} = $${i + 1}`), `updated_at = ${NOW_LOCAL}`];
  const rows = await db.query(
    `UPDATE lotes SET ${sets.join(', ')} WHERE id = $${keys.length + 1} RETURNING *`,
    [...keys.map((k) => data[k]), id],
  );
  return rows[0] ? toLote(rows[0]) : undefined;
}

export async function deleteLote(id: number): Promise<void> {
  if (!Number.isInteger(id)) return;
  const db = await getDb();
  await db.query('DELETE FROM lotes WHERE id = $1', [id]);
}

export function formatPrecio(precio: number): string {
  if (!precio) return '';
  return '$' + precio.toLocaleString('es-AR');
}

export const ESTADO_CONFIG = {
  adjudicado: { label: 'ADJUDICADO', color: '#5cba7a', bgColor: 'rgba(92,186,122,0.12)' },
  subastado: { label: 'SUBASTADO', color: '#6ba3c8', bgColor: 'rgba(107,163,200,0.12)' },
  sin_adjudicar: { label: 'SIN ADJUDICAR', color: '#7a7878', bgColor: 'rgba(122,120,120,0.12)' },
} as const;
