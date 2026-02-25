#!/usr/bin/env node
// scripts/setup-db.js - Create all tables in Turso database
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const val = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch (e) {
  console.warn('Warning: .env.local not found, using existing env vars');
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const SCHEMA = [
  // Blog posts
  `CREATE TABLE IF NOT EXISTS blog_posts (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL DEFAULT '公众号',
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    link TEXT NOT NULL DEFAULT '#',
    featured INTEGER NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    day_number INTEGER,
    read_time TEXT NOT NULL DEFAULT '',
    difficulty TEXT NOT NULL DEFAULT 'beginner',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_blog_date ON blog_posts(date)`,
  `CREATE INDEX IF NOT EXISTS idx_blog_category ON blog_posts(category)`,
  `CREATE INDEX IF NOT EXISTS idx_blog_featured ON blog_posts(featured)`,

  // Tools
  `CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '#',
    icon TEXT NOT NULL DEFAULT '🔧',
    category TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category)`,

  // Gallery (AI drawings)
  `CREATE TABLE IF NOT EXISTS gallery (
    id TEXT PRIMARY KEY,
    src TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'AI 绘图作品',
    description TEXT NOT NULL DEFAULT '',
    style TEXT NOT NULL DEFAULT 'AI 绘图',
    featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_gallery_featured ON gallery(featured)`,

  // Featured works
  `CREATE TABLE IF NOT EXISTS featured_works (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'ai-drawing',
    image_src TEXT NOT NULL,
    alt_text TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    tag TEXT NOT NULL DEFAULT 'AI 绘图',
    details_link TEXT NOT NULL DEFAULT '#',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  // Morning journal
  `CREATE TABLE IF NOT EXISTS morning_journal (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    harvest TEXT NOT NULL DEFAULT '',
    plan TEXT NOT NULL DEFAULT '',
    gratitude TEXT NOT NULL DEFAULT '',
    investment TEXT NOT NULL DEFAULT '',
    connect TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_journal_date ON morning_journal(date)`,

  // Journal settings (single row)
  `CREATE TABLE IF NOT EXISTS journal_settings (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    reference_date TEXT NOT NULL DEFAULT '2025-06-03',
    reference_streak INTEGER NOT NULL DEFAULT 81,
    goal_days INTEGER NOT NULL DEFAULT 365,
    goal_reward TEXT NOT NULL DEFAULT '出一本书',
    reminder_time TEXT NOT NULL DEFAULT '06:00',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  // Auth config (single row)
  `CREATE TABLE IF NOT EXISTS auth_config (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    username TEXT NOT NULL DEFAULT 'admin',
    password_hash TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

async function setup() {
  console.log('Setting up database tables...');

  for (const sql of SCHEMA) {
    try {
      await db.execute(sql);
      const tableName = sql.match(/(?:TABLE|INDEX)\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
      console.log(`  ✓ ${tableName ? tableName[1] : 'executed'}`);
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
      console.error(`    SQL: ${sql.substring(0, 80)}...`);
    }
  }

  console.log('\nDone! All tables created.');
  process.exit(0);
}

setup().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
