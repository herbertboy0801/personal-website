import { getDb } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import { json, error } from '../lib/response.js';
import { galleryFromDb, galleryToDb } from '../lib/transformers.js';

export default async function handler(req, res) {
  const db = getDb();
  const { id } = req.query;

  // PUT /api/gallery/:id
  if (req.method === 'PUT') {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (!id) return error(res, '缺少ID', 400);

    const body = req.body;
    if (!body || !body.src) return error(res, '图片路径不能为空', 400);

    try {
      const d = galleryToDb(body);
      await db.execute({
        sql: `UPDATE gallery SET src=?, title=?, description=?, style=?, featured=?, updated_at=datetime('now') WHERE id = ?`,
        args: [d.src, d.title, d.description, d.style, d.featured, id],
      });

      const result = await db.execute({ sql: 'SELECT * FROM gallery WHERE id = ?', args: [id] });
      if (!result.rows[0]) return error(res, '不存在', 404);
      return json(res, galleryFromDb(result.rows[0]));
    } catch (err) {
      console.error('Gallery PUT error:', err);
      return error(res, '更新失败');
    }
  }

  // DELETE /api/gallery/:id
  if (req.method === 'DELETE') {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (!id) return error(res, '缺少ID', 400);

    try {
      await db.execute({ sql: 'DELETE FROM gallery WHERE id = ?', args: [id] });
      return json(res, { message: '删除成功' });
    } catch (err) {
      console.error('Gallery DELETE error:', err);
      return error(res, '删除失败');
    }
  }

  // GET /api/gallery
  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT * FROM gallery ORDER BY id');
      return json(res, result.rows.map(galleryFromDb));
    } catch (err) {
      console.error('Gallery GET error:', err);
      return error(res, '获取画廊失败');
    }
  }

  // POST /api/gallery (create)
  if (req.method === 'POST') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const body = req.body;
    if (!body || !body.src) return error(res, '图片路径不能为空', 400);

    try {
      const artId = body.id || `art-${Date.now()}`;
      const d = galleryToDb(body);

      await db.execute({
        sql: `INSERT INTO gallery (id, src, title, description, style, featured) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [artId, d.src, d.title, d.description, d.style, d.featured],
      });

      const result = await db.execute({ sql: 'SELECT * FROM gallery WHERE id = ?', args: [artId] });
      return json(res, galleryFromDb(result.rows[0]), 201);
    } catch (err) {
      console.error('Gallery POST error:', err);
      return error(res, '创建失败');
    }
  }

  res.setHeader('Allow', 'GET, POST, PUT, DELETE');
  return error(res, `Method ${req.method} not allowed`, 405);
}
