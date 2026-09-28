import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'subasta.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS lotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_lote TEXT NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT DEFAULT '',
      imagen TEXT DEFAULT '',
      estado TEXT DEFAULT 'sin_adjudicar',
      ganador TEXT DEFAULT '',
      precio_final REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  return db;
}
