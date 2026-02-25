import { getDb } from './lib/db.js';
import { requireAuth } from './lib/auth.js';
import { json, error } from './lib/response.js';
import { journalFromDb, journalToDb } from './lib/transformers.js';

export default async function handler(req, res) {
  const db = getDb();
  const { id, action } = req.query;

  // POST /api/journal/import → rewritten to /api/journal?action=import
  if (req.method === 'POST' && action === 'import') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { entries } = req.body || {};
    if (!Array.isArray(entries) || entries.length === 0) {
      return error(res, '没有可导入的数据', 400);
    }

    try {
      let imported = 0;
      for (const entry of entries) {
        if (!entry.date) continue;
        const entryId = entry.id || entry.date;

        await db.execute({
          sql: `INSERT OR REPLACE INTO morning_journal (id, date, harvest, plan, gratitude, investment, connect)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [entryId, entry.date, entry.harvest || '', entry.plan || '', entry.gratitude || '', entry.investment || '', entry.connect || ''],
        });
        imported++;
      }
      return json(res, { message: `成功导入 ${imported} 条日记`, count: imported });
    } catch (err) {
      console.error('Journal import error:', err);
      return error(res, '导入失败');
    }
  }

  // PUT /api/journal/:id
  if (req.method === 'PUT') {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (!id) return error(res, '缺少ID', 400);

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
      return json(res, journalFromDb(result.rows[0]));
    } catch (err) {
      console.error('Journal PUT error:', err);
      return error(res, '更新失败');
    }
  }

  // DELETE /api/journal/:id
  if (req.method === 'DELETE') {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (!id) return error(res, '缺少ID', 400);

    try {
      await db.execute({ sql: 'DELETE FROM morning_journal WHERE id = ?', args: [id] });
      return json(res, { message: '删除成功' });
    } catch (err) {
      console.error('Journal DELETE error:', err);
      return error(res, '删除失败');
    }
  }

  // GET /api/journal
  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT * FROM morning_journal ORDER BY date DESC');
      return json(res, result.rows.map(journalFromDb));
    } catch (err) {
      console.error('Journal GET error:', err);
      return error(res, '获取日记失败');
    }
  }

  // POST /api/journal (create)
  if (req.method === 'POST') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const body = req.body;
    if (!body || !body.date) return error(res, '日期不能为空', 400);

    try {
      const journalId = body.id || body.date;
      const d = journalToDb(body);

      await db.execute({
        sql: `INSERT OR REPLACE INTO morning_journal (id, date, harvest, plan, gratitude, investment, connect)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [journalId, d.date, d.harvest, d.plan, d.gratitude, d.investment, d.connect],
      });

      const result = await db.execute({ sql: 'SELECT * FROM morning_journal WHERE id = ?', args: [journalId] });
      return json(res, journalFromDb(result.rows[0]), 201);
    } catch (err) {
      console.error('Journal POST error:', err);
      return error(res, '创建日记失败');
    }
  }

  res.setHeader('Allow', 'GET, POST, PUT, DELETE');
  return error(res, `Method ${req.method} not allowed`, 405);
}
