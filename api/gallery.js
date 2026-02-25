import { getDb } from './lib/db.js';
import { requireAuth } from './lib/auth.js';
import { json, error, requireMethod } from './lib/response.js';
import { galleryFromDb, galleryToDb } from './lib/transformers.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;

  const db = getDb();

  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT * FROM gallery ORDER BY id');
      json(res, result.rows.map(galleryFromDb));
    } catch (err) {
      console.error('Gallery GET error:', err);
      error(res, '获取画廊失败');
    }
    return;
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const body = req.body;
  if (!body || !body.src) return error(res, '图片路径不能为空', 400);

  try {
    const id = body.id || `art-${Date.now()}`;
    const d = galleryToDb(body);

    await db.execute({
      sql: `INSERT INTO gallery (id, src, title, description, style, featured) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, d.src, d.title, d.description, d.style, d.featured],
    });

    const result = await db.execute({ sql: 'SELECT * FROM gallery WHERE id = ?', args: [id] });
    json(res, galleryFromDb(result.rows[0]), 201);
  } catch (err) {
    console.error('Gallery POST error:', err);
    error(res, '创建失败');
  }
}
