import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

declare global {
  // eslint-disable-next-line no-var
  var __civicsense_db: Database.Database | undefined;
}

function getDatabase(): Database.Database {
  if (globalThis.__civicsense_db) {
    return globalThis.__civicsense_db;
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'civicsense.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'citizen' CHECK(role IN ('citizen', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      photo_url TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      street_name TEXT NOT NULL,
      landmark TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected')),
      admin_response TEXT,
      responded_at DATETIME,
      responded_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_issues_user_id ON issues(user_id);
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
  `);

  // Auto-seed admin user (username: admin, password: admin)
  const existingAdmin = db.prepare('SELECT id, username FROM users WHERE username = ? COLLATE NOCASE').get('admin');
  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('admin', salt);
    try {
      db.prepare(`
        INSERT OR IGNORE INTO users (username, password_hash, role)
        VALUES (?, ?, 'admin')
      `).run('admin', passwordHash);
      console.log('[CivicSense DB] Seeded default admin account (username: admin, password: admin)');
    } catch {
      // Handled if concurrent worker already inserted
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    globalThis.__civicsense_db = db;
  }

  return db;
}

export const db = getDatabase();
export default db;

