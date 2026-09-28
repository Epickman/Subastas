import { getDb } from './db';

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

export function getAllLotes(): Lote[] {
  return getDb()
    .prepare('SELECT * FROM lotes ORDER BY CAST(numero_lote AS INTEGER) ASC, numero_lote ASC')
    .all() as Lote[];
}

export function getLoteById(id: number): Lote | undefined {
  return getDb()
    .prepare('SELECT * FROM lotes WHERE id = ?')
    .get(id) as Lote | undefined;
}

export function createLote(data: LoteInput): Lote {
  const result = getDb()
    .prepare(`
      INSERT INTO lotes (numero_lote, nombre, descripcion, imagen, estado, ganador, precio_final)
      VALUES (@numero_lote, @nombre, @descripcion, @imagen, @estado, @ganador, @precio_final)
    `)
    .run(data);
  return getLoteById(Number(result.lastInsertRowid))!;
}

export function updateLote(id: number, data: Partial<LoteInput>): Lote | undefined {
  if (Object.keys(data).length === 0) return getLoteById(id);
  const sets = [...Object.keys(data).map(k => `${k} = @${k}`), "updated_at = datetime('now', 'localtime')"];
  getDb()
    .prepare(`UPDATE lotes SET ${sets.join(', ')} WHERE id = @id`)
    .run({ ...data, id });
  return getLoteById(id);
}

export function deleteLote(id: number): void {
  getDb().prepare('DELETE FROM lotes WHERE id = ?').run(id);
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
