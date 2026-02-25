import { getDb } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import { json, error, requireMethod } from '../lib/response.js';
import { galleryFromDb, galleryToDb } from '../lib/transformers.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, ['PUT', 'DELETE'])) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;
  if (!id) return error(res, '缺少ID', 400);

  const db = getDb();

  if (req.method === 'DELETE') {
    try {
      await db.execute({ sql: 'DELETE FROM gallery WHERE id = ?', args: [id] });
      json(res, { message: '删除成功' });
    } catch (err) {
      console.error('Gallery DELETE error:', err);
      error(res, '删除失败');
    }
    return;
  }

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
    json(res, galleryFromDb(result.rows[0]));
  } catch (err) {
    console.error('Gallery PUT error:', err);
    error(res, '更新失败');
  }
}
