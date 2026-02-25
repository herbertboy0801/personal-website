import { getDb } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import { json, error, requireMethod } from '../lib/response.js';
import { toolFromDb, toolToDb } from '../lib/transformers.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, ['PUT', 'DELETE'])) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;
  if (!id) return error(res, '缺少ID', 400);

  const db = getDb();

  if (req.method === 'DELETE') {
    try {
      await db.execute({ sql: 'DELETE FROM tools WHERE id = ?', args: [id] });
      json(res, { message: '删除成功' });
    } catch (err) {
      console.error('Tools DELETE error:', err);
      error(res, '删除失败');
    }
    return;
  }

  const body = req.body;
  if (!body || !body.name) return error(res, '工具名称不能为空', 400);

  try {
    const d = toolToDb(body);
    await db.execute({
      sql: `UPDATE tools SET name=?, description=?, url=?, icon=?, category=?, tags=?, updated_at=datetime('now') WHERE id = ?`,
      args: [d.name, d.description, d.url, d.icon, d.category, d.tags, id],
    });

    const result = await db.execute({ sql: 'SELECT * FROM tools WHERE id = ?', args: [id] });
    if (!result.rows[0]) return error(res, '工具不存在', 404);
    json(res, toolFromDb(result.rows[0]));
  } catch (err) {
    console.error('Tools PUT error:', err);
    error(res, '更新失败');
  }
}
