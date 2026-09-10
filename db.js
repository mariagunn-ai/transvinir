const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'transvinir.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    body_md TEXT NOT NULL,
    title_en TEXT,
    summary_en TEXT,
    body_md_en TEXT,
    cover_image TEXT,
    published INTEGER NOT NULL DEFAULT 1,
    published_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_news_published ON news(published, published_at DESC);

  CREATE TABLE IF NOT EXISTS pages (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body_md TEXT NOT NULL,
    title_en TEXT,
    body_md_en TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS polaroids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const columnExists = (table, column) => {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some(c => c.name === column);
};
const addColumn = (table, column, type) => {
  if (!columnExists(table, column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
};
addColumn('news', 'title_en', 'TEXT');
addColumn('news', 'summary_en', 'TEXT');
addColumn('news', 'body_md_en', 'TEXT');
addColumn('news', 'sort_order', 'INTEGER NOT NULL DEFAULT 0');
addColumn('pages', 'title_en', 'TEXT');
addColumn('pages', 'body_md_en', 'TEXT');

const totalNews = db.prepare('SELECT COUNT(*) AS c FROM news').get().c;
const unsortedNews = db.prepare('SELECT COUNT(*) AS c FROM news WHERE sort_order = 0').get().c;
if (totalNews > 0 && unsortedNews === totalNews) {
  const rows = db.prepare('SELECT id FROM news ORDER BY published_at DESC').all();
  const update = db.prepare('UPDATE news SET sort_order = ? WHERE id = ?');
  let order = 1;
  for (const r of rows) update.run(order++, r.id);
}

module.exports = db;
