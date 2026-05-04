const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const db = new Database(path.resolve(process.env.DB_PATH || './betcouple.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    user      TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    avatar    TEXT NOT NULL DEFAULT '🃏',
    color_key TEXT NOT NULL DEFAULT 'blue'
  );

  CREATE TABLE IF NOT EXISTS credits (
    user   TEXT PRIMARY KEY,
    amount REAL NOT NULL DEFAULT 100
  );

  CREATE TABLE IF NOT EXISTS bets (
    id             TEXT PRIMARY KEY,
    creator        TEXT NOT NULL,
    title          TEXT NOT NULL,
    quota          REAL NOT NULL,
    stake          INTEGER NOT NULL,
    potential_win  INTEGER NOT NULL,
    category       TEXT NOT NULL DEFAULT 'altro',
    is_secret      INTEGER NOT NULL DEFAULT 0,
    is_counterable INTEGER NOT NULL DEFAULT 0,
    pegno          TEXT,
    expires_at     INTEGER,
    created_at     INTEGER NOT NULL,
    status         TEXT NOT NULL DEFAULT 'active',
    flamed         INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS counter_bets (
    id            TEXT PRIMARY KEY,
    bet_id        TEXT NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
    bettor        TEXT NOT NULL,
    side          TEXT NOT NULL CHECK(side IN ('yes','no')),
    quota_used    REAL NOT NULL,
    stake         INTEGER NOT NULL,
    potential_win INTEGER NOT NULL,
    status        TEXT NOT NULL DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS categories (
    id    TEXT PRIMARY KEY,
    emoji TEXT NOT NULL,
    label TEXT NOT NULL,
    color TEXT NOT NULL
  );

  INSERT OR IGNORE INTO profiles VALUES ('tomas',  'Tomas',  '🃏', 'blue');
  INSERT OR IGNORE INTO profiles VALUES ('giulia', 'Giulia', '♥️', 'purple');
  INSERT OR IGNORE INTO credits  VALUES ('tomas',  100);
  INSERT OR IGNORE INTO credits  VALUES ('giulia', 100);
`);

module.exports = db;
