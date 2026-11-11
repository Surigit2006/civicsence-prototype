import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'civicsense.db'));
db.pragma('journal_mode = WAL');

// Ensure tables exist
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
`);

// 1. Ensure admin (admin / admin)
const adminHash = bcrypt.hashSync('admin', 10);
db.prepare(`
  INSERT OR IGNORE INTO users (username, password_hash, role)
  VALUES ('admin', ?, 'admin')
`).run(adminHash);

const adminUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');

// 2. Create demo citizen
const citizenHash = bcrypt.hashSync('citizen123', 10);
db.prepare(`
  INSERT OR IGNORE INTO users (username, password_hash, role)
  VALUES ('citizen_alex', ?, 'citizen')
`).run(citizenHash);

const citizenUser = db.prepare('SELECT id FROM users WHERE username = ?').get('citizen_alex');

// 3. Demo Issues
const existingCount = db.prepare('SELECT COUNT(*) as count FROM issues').get();
if (existingCount.count === 0) {
  // Demo SVG image 1 (pothole simulation)
  const samplePhoto1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect fill="%23475569" width="600" height="400"/><ellipse cx="300" cy="220" rx="140" ry="70" fill="%231e293b" stroke="%230f172a" stroke-width="8"/><text x="300" y="80" font-family="sans-serif" font-weight="bold" font-size="24" fill="%23f8fafc" text-anchor="middle">Civic Evidence: Severe Road Pothole</text><text x="300" y="360" font-family="sans-serif" font-size="14" fill="%2394a3b8" text-anchor="middle">Location: 5th Cross Road, Anna Nagar</text></svg>`;

  // Demo SVG image 2 (garbage simulation)
  const samplePhoto2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect fill="%23334155" width="600" height="400"/><rect x="200" y="160" width="200" height="150" rx="10" fill="%230284c7"/><text x="300" y="80" font-family="sans-serif" font-weight="bold" font-size="24" fill="%23f8fafc" text-anchor="middle">Civic Evidence: Overflowing Waste Bin</text><text x="300" y="360" font-family="sans-serif" font-size="14" fill="%2394a3b8" text-anchor="middle">Location: Market Street Corner</text></svg>`;

  // Issue 1: In Progress with municipality response
  db.prepare(`
    INSERT INTO issues (
      user_id, title, category, description, photo_url, latitude, longitude, street_name, landmark, status, admin_response, responded_at, responded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 hours'), ?)
  `).run(
    citizenUser.id,
    'Hazardous deep pothole near crossroad signal',
    'Roads & Potholes',
    'Around 2 feet diameter pothole causing traffic slowdown and safety hazard for two-wheelers.',
    samplePhoto1,
    13.0850,
    80.2720,
    '5th Cross Road, Anna Nagar',
    'Opposite City Central Library',
    'In Progress',
    'Zone 4 Highway maintenance van dispatched. Bitumen and gravel patching is underway. Will be rolled by this evening.',
    adminUser.id
  );

  // Issue 2: Resolved with municipality response
  db.prepare(`
    INSERT INTO issues (
      user_id, title, category, description, photo_url, latitude, longitude, street_name, landmark, status, admin_response, responded_at, responded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 day'), ?)
  `).run(
    citizenUser.id,
    'Overflowing commercial garbage dumpster',
    'Garbage & Waste',
    'Trash spilled over onto footpath, causing foul odor and blocking pedestrians.',
    samplePhoto2,
    13.0805,
    80.2680,
    'Market Bazaar Road',
    'Near Metro Gate 2',
    'Resolved',
    'Sanitation compactor cleared 1.5 tons of waste. Container sanitized and secondary bin installed.',
    adminUser.id
  );

  console.log('Seeded 2 demo issues with municipality responses.');
}

db.close();
console.log('Database initialization complete.');
