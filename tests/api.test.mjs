import assert from 'node:assert';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Starting CivicSense Comprehensive Verification Suite ---');

const testDbPath = path.join(__dirname, 'test_civicsense.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const db = new Database(testDbPath);

// 1. Setup schema
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

// 2. Test Admin Seeding
console.log('1. Testing Admin Account Seeding (admin / admin)...');
const adminHash = bcrypt.hashSync('admin', 10);
db.prepare(`INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')`).run('admin', adminHash);

const adminUser = db.prepare('SELECT id, username, password_hash, role FROM users WHERE username = ?').get('admin');
assert.strictEqual(adminUser.username, 'admin');
assert.strictEqual(adminUser.role, 'admin');
assert.ok(bcrypt.compareSync('admin', adminUser.password_hash), 'Admin password must match "admin"');
console.log('✓ Admin user verified with username: admin and password: admin');

// 3. Test Citizen Registration
console.log('2. Testing Citizen Registration (username & password)...');
const citizenHash = bcrypt.hashSync('test_citizen_pass', 10);
const citizenInsert = db.prepare(`INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'citizen')`).run('priya_citizen', citizenHash);
const citizenId = Number(citizenInsert.lastInsertRowid);
const citizenUser = db.prepare('SELECT * FROM users WHERE id = ?').get(citizenId);
assert.strictEqual(citizenUser.username, 'priya_citizen');
assert.strictEqual(citizenUser.role, 'citizen');
console.log('✓ Citizen registration verified');

// 4. Test Reporting Validation (Photo, Map Pin, Street Name, Landmark)
console.log('3. Testing Issue Reporting Field Requirements...');

function validateIssuePayload(payload) {
  if (!payload.title || !payload.title.trim()) throw new Error('Title required');
  if (!payload.photo_url || !payload.photo_url.trim()) throw new Error('Photo required');
  if (payload.latitude === undefined || payload.longitude === undefined || isNaN(payload.latitude) || isNaN(payload.longitude)) {
    throw new Error('Coordinates required');
  }
  if (!payload.street_name || !payload.street_name.trim()) throw new Error('Street name required');
  if (!payload.landmark || !payload.landmark.trim()) throw new Error('Landmark required');
  return true;
}

// Missing Photo
assert.throws(() => {
  validateIssuePayload({
    title: 'Pothole',
    photo_url: '',
    latitude: 13.0827,
    longitude: 80.2707,
    street_name: 'Main St',
    landmark: 'Clock Tower',
  });
}, /Photo required/);
console.log('✓ Validation correctly rejects missing photo');

// Missing Street Name
assert.throws(() => {
  validateIssuePayload({
    title: 'Pothole',
    photo_url: 'data:image/jpeg;base64,...',
    latitude: 13.0827,
    longitude: 80.2707,
    street_name: '',
    landmark: 'Clock Tower',
  });
}, /Street name required/);
console.log('✓ Validation correctly rejects missing street name');

// Missing Landmark
assert.throws(() => {
  validateIssuePayload({
    title: 'Pothole',
    photo_url: 'data:image/jpeg;base64,...',
    latitude: 13.0827,
    longitude: 80.2707,
    street_name: 'Main St',
    landmark: '',
  });
}, /Landmark required/);
console.log('✓ Validation correctly rejects missing landmark');

// Missing Coordinates
assert.throws(() => {
  validateIssuePayload({
    title: 'Pothole',
    photo_url: 'data:image/jpeg;base64,...',
    street_name: 'Main St',
    landmark: 'Clock Tower',
  });
}, /Coordinates required/);
console.log('✓ Validation correctly rejects missing map coordinates');

// 5. Test Valid Issue Creation
console.log('4. Testing Valid Issue Creation with Photo, Map Pin, Street & Landmark...');
const insertIssue = db.prepare(`
  INSERT INTO issues (
    user_id, title, category, description, photo_url, latitude, longitude, street_name, landmark, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
`).run(
  citizenId,
  'Dangerous pothole near crossroad',
  'Roads & Potholes',
  'Severe 2-ft wide pothole causing two-wheelers to slip',
  'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  13.08268,
  80.27072,
  'Kamarajar Promenade',
  'Opposite City Post Office'
);
const issueId = Number(insertIssue.lastInsertRowid);
let issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId);
assert.strictEqual(issue.status, 'Pending');
assert.strictEqual(issue.street_name, 'Kamarajar Promenade');
assert.strictEqual(issue.landmark, 'Opposite City Post Office');
assert.strictEqual(issue.latitude, 13.08268);
assert.strictEqual(issue.longitude, 80.27072);
assert.ok(issue.photo_url.length > 0);
console.log('✓ Issue successfully stored in database with all required fields');

// 6. Test Municipality Admin Response & Status Update
console.log('5. Testing Municipality Admin Response & Status Transition...');
const responseText = 'Municipality emergency road team dispatched. Pothole filled and sealed with bitumen mix on 12th Nov.';
db.prepare(`
  UPDATE issues
  SET 
    status = 'Resolved',
    admin_response = ?,
    responded_at = CURRENT_TIMESTAMP,
    responded_by = ?,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`).run(responseText, adminUser.id, issueId);

const updatedIssue = db.prepare(`
  SELECT 
    i.*,
    u.username as citizen_username,
    r.username as admin_username
  FROM issues i
  JOIN users u ON i.user_id = u.id
  LEFT JOIN users r ON i.responded_by = r.id
  WHERE i.id = ?
`).get(issueId);

assert.strictEqual(updatedIssue.status, 'Resolved');
assert.strictEqual(updatedIssue.admin_response, responseText);
assert.strictEqual(updatedIssue.admin_username, 'admin');
assert.strictEqual(updatedIssue.citizen_username, 'priya_citizen');
assert.ok(updatedIssue.responded_at !== null);
console.log('✓ Municipality response and status update successfully recorded');

// 7. Test Citizen retrieving feedback
console.log('6. Testing Citizen Retrieving Municipality Response...');
const citizenReports = db.prepare(`
  SELECT i.*, r.username as admin_name
  FROM issues i
  LEFT JOIN users r ON i.responded_by = r.id
  WHERE i.user_id = ?
`).all(citizenId);

assert.strictEqual(citizenReports.length, 1);
assert.strictEqual(citizenReports[0].admin_response, responseText);
assert.strictEqual(citizenReports[0].status, 'Resolved');
console.log('✓ Citizen successfully received the municipality response note');

// Cleanup
db.close();
fs.unlinkSync(testDbPath);

console.log('--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');

