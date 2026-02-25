import { getDb } from './lib/db.js';
import { requireAuth } from './lib/auth.js';
import { json, error, requireMethod } from './lib/response.js';
import { journalFromDb, journalToDb } from './lib/transformers.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;

  const db = getDb();

  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT * FROM morning_journal ORDER BY date DESC');
      json(res, result.rows.map(journalFromDb));
    } catch (err) {
      console.error('Journal GET error:', err);
      error(res, '获取日记失败');
    }
    return;
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const body = req.body;
  if (!body || !body.date) return error(res, '日期不能为空', 400);

  try {
    const id = body.id || body.date;
    const d = journalToDb(body);

    await db.execute({
      sql: `INSERT OR REPLACE INTO morning_journal (id, date, harvest, plan, gratitude, investment, connect)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, d.date, d.harvest, d.plan, d.gratitude, d.investment, d.connect],
    });

    const result = await db.execute({ sql: 'SELECT * FROM morning_journal WHERE id = ?', args: [id] });
    json(res, journalFromDb(result.rows[0]), 201);
  } catch (err) {
    console.error('Journal POST error:', err);
    error(res, '创建日记失败');
  }
}
