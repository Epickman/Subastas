import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

// Lazy init: DATABASE_URL may be missing at build time.
let sql: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL no está configurada');
    sql = neon(url);
  }
  return sql;
}

// Hora local de Argentina como texto, igual que el formato que usaba SQLite.
export const NOW_LOCAL =
  "to_char(now() AT TIME ZONE 'America/Argentina/Buenos_Aires', 'YYYY-MM-DD HH24:MI:SS')";

function ensureSchema(db: NeonQueryFunction<false, false>): Promise<void> {
  if (!schemaReady) {
    schemaReady = db
      .query(`
        CREATE TABLE IF NOT EXISTS lotes (
          id SERIAL PRIMARY KEY,
          numero_lote TEXT NOT NULL,
          nombre TEXT NOT NULL,
          descripcion TEXT DEFAULT '',
          imagen TEXT DEFAULT '',
          estado TEXT DEFAULT 'pendiente',
          ganador TEXT DEFAULT '',
          precio_final DOUBLE PRECISION DEFAULT 0,
          precio_base DOUBLE PRECISION DEFAULT 0,
          galeria JSONB DEFAULT '[]'::jsonb,
          created_at TEXT DEFAULT ${NOW_LOCAL},
          updated_at TEXT DEFAULT ${NOW_LOCAL}
        )
      `)
      // Tablas creadas antes de agregar precio_base.
      .then(() => db.query('ALTER TABLE lotes ADD COLUMN IF NOT EXISTS precio_base DOUBLE PRECISION DEFAULT 0'))
      // Tablas creadas antes de agregar la galería.
      .then(() => db.query("ALTER TABLE lotes ADD COLUMN IF NOT EXISTS galeria JSONB DEFAULT '[]'::jsonb"))
      .then(() => undefined)
      .catch((e) => {
        schemaReady = null;
        throw e;
      });
  }
  return schemaReady;
}

export async function getDb(): Promise<NeonQueryFunction<false, false>> {
  const db = getSql();
  await ensureSchema(db);
  return db;
}
