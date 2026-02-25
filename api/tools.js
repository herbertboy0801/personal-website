import { getDb } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import { json, error } from '../lib/response.js';
import { toolFromDb, toolToDb } from '../lib/transformers.js';

export default async function handler(req, res) {
  const db = getDb();
  const { id } = req.query;

  // PUT /api/tools/:id
  if (req.method === 'PUT') {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (!id) return error(res, '缺少ID', 400);

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
      return json(res, toolFromDb(result.rows[0]));
    } catch (err) {
      console.error('Tools PUT error:', err);
      return error(res, '更新失败');
    }
  }

  // DELETE /api/tools/:id
  if (req.method === 'DELETE') {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (!id) return error(res, '缺少ID', 400);

    try {
      await db.execute({ sql: 'DELETE FROM tools WHERE id = ?', args: [id] });
      return json(res, { message: '删除成功' });
    } catch (err) {
      console.error('Tools DELETE error:', err);
      return error(res, '删除失败');
    }
  }

  // GET /api/tools
  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT * FROM tools ORDER BY id');
      return json(res, result.rows.map(toolFromDb));
    } catch (err) {
      console.error('Tools GET error:', err);
      return error(res, '获取工具失败');
    }
  }

  // POST /api/tools (create)
  if (req.method === 'POST') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const body = req.body;
    if (!body || !body.name) return error(res, '工具名称不能为空', 400);

    try {
      const toolId = body.id || `tools-${Date.now()}`;
      const d = toolToDb(body);

      await db.execute({
        sql: `INSERT INTO tools (id, name, description, url, icon, category, tags) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [toolId, d.name, d.description, d.url, d.icon, d.category, d.tags],
      });

      const result = await db.execute({ sql: 'SELECT * FROM tools WHERE id = ?', args: [toolId] });
      return json(res, toolFromDb(result.rows[0]), 201);
    } catch (err) {
      console.error('Tools POST error:', err);
      return error(res, '创建工具失败');
    }
  }

  res.setHeader('Allow', 'GET, POST, PUT, DELETE');
  return error(res, `Method ${req.method} not allowed`, 405);
}
