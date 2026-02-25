import { getDb } from './lib/db.js';
import { requireAuth } from './lib/auth.js';
import { json, error } from './lib/response.js';
import { worksFromDb, worksToDb } from './lib/transformers.js';

export default async function handler(req, res) {
  const db = getDb();
  const { id } = req.query;

  // PUT /api/works/:id
  if (req.method === 'PUT') {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (!id) return error(res, '缺少ID', 400);

    const body = req.body;
    if (!body || !body.title) return error(res, '标题不能为空', 400);

    try {
      const d = worksToDb(body);
      await db.execute({
        sql: `UPDATE featured_works SET type=?, image_src=?, alt_text=?, title=?, description=?, tag=?, details_link=?, updated_at=datetime('now')
              WHERE id = ?`,
        args: [d.type, d.image_src, d.alt_text, d.title, d.description, d.tag, d.details_link, id],
      });

      const result = await db.execute({ sql: 'SELECT * FROM featured_works WHERE id = ?', args: [id] });
      if (!result.rows[0]) return error(res, '作品不存在', 404);
      return json(res, worksFromDb(result.rows[0]));
    } catch (err) {
      console.error('Works PUT error:', err);
      return error(res, '更新失败');
    }
  }

  // DELETE /api/works/:id
  if (req.method === 'DELETE') {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (!id) return error(res, '缺少ID', 400);

    try {
      await db.execute({ sql: 'DELETE FROM featured_works WHERE id = ?', args: [id] });
      return json(res, { message: '删除成功' });
    } catch (err) {
      console.error('Works DELETE error:', err);
      return error(res, '删除失败');
    }
  }

  // GET /api/works
  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT * FROM featured_works');
      return json(res, result.rows.map(worksFromDb));
    } catch (err) {
      console.error('Works GET error:', err);
      return error(res, '获取作品失败');
    }
  }

  // POST /api/works (create)
  if (req.method === 'POST') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const body = req.body;
    if (!body || !body.title || !body.imageSrc) {
      return error(res, '标题和图片不能为空', 400);
    }

    try {
      const workId = body.id || `works-${Date.now()}`;
      const d = worksToDb(body);

      await db.execute({
        sql: `INSERT INTO featured_works (id, type, image_src, alt_text, title, description, tag, details_link)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [workId, d.type, d.image_src, d.alt_text, d.title, d.description, d.tag, d.details_link],
      });

      const result = await db.execute({ sql: 'SELECT * FROM featured_works WHERE id = ?', args: [workId] });
      return json(res, worksFromDb(result.rows[0]), 201);
    } catch (err) {
      console.error('Works POST error:', err);
      return error(res, '创建作品失败');
    }
  }

  res.setHeader('Allow', 'GET, POST, PUT, DELETE');
  return error(res, `Method ${req.method} not allowed`, 405);
}
