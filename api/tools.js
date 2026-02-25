import { getDb } from './lib/db.js';
import { requireAuth } from './lib/auth.js';
import { json, error, requireMethod } from './lib/response.js';
import { toolFromDb, toolToDb } from './lib/transformers.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;

  const db = getDb();

  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT * FROM tools ORDER BY id');
      json(res, result.rows.map(toolFromDb));
    } catch (err) {
      console.error('Tools GET error:', err);
      error(res, '获取工具失败');
    }
    return;
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const body = req.body;
  if (!body || !body.name) return error(res, '工具名称不能为空', 400);

  try {
    const id = body.id || `tools-${Date.now()}`;
    const d = toolToDb(body);

    await db.execute({
      sql: `INSERT INTO tools (id, name, description, url, icon, category, tags) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, d.name, d.description, d.url, d.icon, d.category, d.tags],
    });

    const result = await db.execute({ sql: 'SELECT * FROM tools WHERE id = ?', args: [id] });
    json(res, toolFromDb(result.rows[0]), 201);
  } catch (err) {
    console.error('Tools POST error:', err);
    error(res, '创建工具失败');
  }
}
