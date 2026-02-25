#!/usr/bin/env node
// scripts/migrate-to-turso.js - Migrate data from JS files to Turso database
import { createClient } from '@libsql/client';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
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

// Read a JS data file and extract the data using vm
function readJsData(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/=\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*;/m);
  if (!match || !match[1]) {
    throw new Error(`Could not parse data from ${filePath}`);
  }
  return vm.runInNewContext(`(${match[1]})`, {}, { timeout: 5000 });
}

// Read a CommonJS module-style file
function readModuleData(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/module\.exports\s*=\s*(\{[\s\S]*\})\s*;?/m);
  if (!match || !match[1]) {
    throw new Error(`Could not parse module from ${filePath}`);
  }
  return vm.runInNewContext(`(${match[1]})`, {}, { timeout: 5000 });
}

const DATA_DIR = path.join(__dirname, '..', 'admin');

async function migrateBlogPosts() {
  const data = readJsData(path.join(DATA_DIR, 'blog-posts-data.js'));
  console.log(`\nMigrating ${data.length} blog posts...`);

  for (const p of data) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO blog_posts (id, source, title, summary, link, featured, date, category, tags, day_number, read_time, difficulty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p.id, p.source || '公众号', p.title, p.summary || '', p.link || '#',
        p.featured ? 1 : 0, p.date || '', p.category || '',
        JSON.stringify(p.tags || []), p.dayNumber ?? null,
        p.readTime || '', p.difficulty || 'beginner'
      ],
    });
  }
  console.log(`  ✓ ${data.length} blog posts migrated`);
}

async function migrateTools() {
  const data = readJsData(path.join(DATA_DIR, 'tool-library-data.js'));
  console.log(`\nMigrating ${data.length} tools...`);

  for (const t of data) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO tools (id, name, description, url, icon, category, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        t.id, t.name, t.description || '', t.url || '#',
        t.icon || '🔧', t.category || '', JSON.stringify(t.tags || [])
      ],
    });
  }
  console.log(`  ✓ ${data.length} tools migrated`);
}

async function migrateGallery() {
  const data = readJsData(path.join(DATA_DIR, 'gallery-data.js'));
  console.log(`\nMigrating ${data.length} gallery items...`);

  for (const g of data) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO gallery (id, src, title, description, style, featured)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        g.id, g.src, g.title || 'AI 绘图作品', g.description || '',
        g.style || 'AI 绘图', g.featured ? 1 : 0
      ],
    });
  }
  console.log(`  ✓ ${data.length} gallery items migrated`);
}

async function migrateFeaturedWorks() {
  const data = readJsData(path.join(DATA_DIR, 'featured-works-data.js'));
  console.log(`\nMigrating ${data.length} featured works...`);

  for (const w of data) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO featured_works (id, type, image_src, alt_text, title, description, tag, details_link)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        w.id, w.type || 'ai-drawing', w.imageSrc, w.altText || '',
        w.title, w.description || '', w.tag || 'AI 绘图', w.detailsLink || '#'
      ],
    });
  }
  console.log(`  ✓ ${data.length} featured works migrated`);
}

async function migrateJournal() {
  const data = readJsData(path.join(DATA_DIR, 'morning-journal-data.js'));
  console.log(`\nMigrating ${data.length} journal entries...`);

  for (const j of data) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO morning_journal (id, date, harvest, plan, gratitude, investment, connect)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        j.id, j.date, j.harvest || '', j.plan || '',
        j.gratitude || '', j.investment || '', j.connect || ''
      ],
    });
  }
  console.log(`  ✓ ${data.length} journal entries migrated`);
}

async function migrateJournalSettings() {
  const data = readJsData(path.join(DATA_DIR, 'journal-settings.js'));
  console.log('\nMigrating journal settings...');

  await db.execute({
    sql: `INSERT OR REPLACE INTO journal_settings (id, reference_date, reference_streak, goal_days, goal_reward, reminder_time)
          VALUES (1, ?, ?, ?, ?, ?)`,
    args: [
      data.referenceDate || '2025-06-03',
      data.referenceStreak || 81,
      data.goalDays || 365,
      data.goalReward || '出一本书',
      data.reminderTime || '06:00'
    ],
  });
  console.log('  ✓ Journal settings migrated');
}

async function migrateAuthConfig() {
  const data = readModuleData(path.join(DATA_DIR, 'auth-config.js'));
  console.log('\nMigrating auth config...');

  await db.execute({
    sql: `INSERT OR REPLACE INTO auth_config (id, username, password_hash)
          VALUES (1, ?, ?)`,
    args: [data.adminUsername || 'admin', data.adminPasswordHash],
  });
  console.log('  ✓ Auth config migrated');
}

async function verify() {
  console.log('\n--- Verification ---');
  const tables = ['blog_posts', 'tools', 'gallery', 'featured_works', 'morning_journal', 'journal_settings', 'auth_config'];

  for (const table of tables) {
    const result = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
    console.log(`  ${table}: ${result.rows[0].count} rows`);
  }
}

async function main() {
  console.log('Starting migration to Turso...');
  console.log(`Data directory: ${DATA_DIR}`);

  await migrateBlogPosts();
  await migrateTools();
  await migrateGallery();
  await migrateFeaturedWorks();
  await migrateJournal();
  await migrateJournalSettings();
  await migrateAuthConfig();
  await verify();

  console.log('\nMigration complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
