import { getDb } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import { json, error, requireMethod } from '../lib/response.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, 'POST')) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  const { entries } = req.body || {};
  if (!Array.isArray(entries) || entries.length === 0) {
    return error(res, '没有可导入的数据', 400);
  }

  try {
    const db = getDb();
    let imported = 0;

    for (const entry of entries) {
      if (!entry.date) continue;
      const id = entry.id || entry.date;

      await db.execute({
        sql: `INSERT OR REPLACE INTO morning_journal (id, date, harvest, plan, gratitude, investment, connect)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [id, entry.date, entry.harvest || '', entry.plan || '', entry.gratitude || '', entry.investment || '', entry.connect || ''],
      });
      imported++;
    }

    json(res, { message: `成功导入 ${imported} 条日记`, count: imported });
  } catch (err) {
    console.error('Journal import error:', err);
    error(res, '导入失败');
  }
}
