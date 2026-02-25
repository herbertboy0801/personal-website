import { getDb } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import { json, error, requireMethod } from '../lib/response.js';
import { journalFromDb, journalToDb } from '../lib/transformers.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, ['PUT', 'DELETE'])) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;
  if (!id) return error(res, '缺少ID', 400);

  const db = getDb();

  if (req.method === 'DELETE') {
    try {
      await db.execute({ sql: 'DELETE FROM morning_journal WHERE id = ?', args: [id] });
      json(res, { message: '删除成功' });
    } catch (err) {
      console.error('Journal DELETE error:', err);
      error(res, '删除失败');
    }
    return;
  }

  const body = req.body;
  try {
    const d = journalToDb(body);
    await db.execute({
      sql: `UPDATE morning_journal SET date=?, harvest=?, plan=?, gratitude=?, investment=?, connect=?, updated_at=datetime('now')
            WHERE id = ?`,
      args: [d.date, d.harvest, d.plan, d.gratitude, d.investment, d.connect, id],
    });

    const result = await db.execute({ sql: 'SELECT * FROM morning_journal WHERE id = ?', args: [id] });
    if (!result.rows[0]) return error(res, '日记不存在', 404);
    json(res, journalFromDb(result.rows[0]));
  } catch (err) {
    console.error('Journal PUT error:', err);
    error(res, '更新失败');
  }
}
