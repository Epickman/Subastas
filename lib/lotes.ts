import { getDb, NOW_LOCAL } from './db';

export type EstadoLote = 'pendiente' | 'subastado';

export interface Lote {
  id: number;
  numero_lote: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  // Imágenes y videos adicionales; `imagen` es la portada.
  galeria: string[];
  estado: EstadoLote;
  ganador: string;
  precio_final: number;
  precio_base: number;
  created_at: string;
  updated_at: string;
}

export type LoteInput = {
  numero_lote: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  galeria: string[];
  estado: EstadoLote;
  ganador: string;
  precio_final: number;
  precio_base: number;
};

const COLUMNAS: (keyof LoteInput)[] = [
  'numero_lote', 'nombre', 'descripcion', 'imagen', 'estado', 'ganador', 'precio_final', 'precio_base', 'galeria',
];

// galeria es JSONB: se manda como texto JSON.
function valor(data: Partial<LoteInput>, c: keyof LoteInput) {
  return c === 'galeria' ? JSON.stringify(data.galeria) : data[c];
}

// Estados anteriores ('adjudicado', 'sin_adjudicar') se leen como los actuales.
function toEstado(value: unknown): EstadoLote {
  return value === 'subastado' || value === 'adjudicado' ? 'subastado' : 'pendiente';
}

function toLote(row: Record<string, unknown>): Lote {
  return {
    ...(row as unknown as Lote),
    estado: toEstado(row.estado),
    precio_final: Number(row.precio_final ?? 0),
    precio_base: Number(row.precio_base ?? 0),
    galeria: Array.isArray(row.galeria) ? row.galeria.map(String) : [],
  };
}

export async function getAllLotes(): Promise<Lote[]> {
  const db = await getDb();
  // Primero el orden elegido en el admin; los lotes sin orden van al final por
  // número de lote (numéricos en orden numérico, el resto alfabético).
  const rows = await db.query(`
    SELECT * FROM lotes
    ORDER BY orden ASC NULLS LAST,
             CASE WHEN numero_lote ~ '^[0-9]+$' THEN numero_lote::numeric END ASC NULLS LAST,
             numero_lote ASC
  `);
  return rows.map(toLote);
}

// Guarda el orden de la lista: el primer id queda en la posición 1.
export async function reordenarLotes(ids: number[]): Promise<void> {
  const db = await getDb();
  await db.query(
    `UPDATE lotes SET orden = t.pos
     FROM unnest($1::int[]) WITH ORDINALITY AS t(id, pos)
     WHERE lotes.id = t.id`,
    [ids],
  );
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
    `INSERT INTO lotes (numero_lote, nombre, descripcion, imagen, estado, ganador, precio_final, precio_base, galeria)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    COLUMNAS.map((c) => valor(data, c)),
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
    [...keys.map((k) => valor(data, k)), id],
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
  pendiente: { label: 'PENDIENTE DE SUBASTA', color: '#c8a96e', bgColor: 'rgba(200,169,110,0.12)' },
  subastado: { label: 'SUBASTADO', color: '#5cba7a', bgColor: 'rgba(92,186,122,0.12)' },
} as const;
