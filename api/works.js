import { getDb } from './lib/db.js';
import { requireAuth } from './lib/auth.js';
import { json, error, requireMethod } from './lib/response.js';
import { worksFromDb, worksToDb } from './lib/transformers.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;

  const db = getDb();

  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT * FROM featured_works');
      json(res, result.rows.map(worksFromDb));
    } catch (err) {
      console.error('Works GET error:', err);
      error(res, '获取作品失败');
    }
    return;
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const body = req.body;
  if (!body || !body.title || !body.imageSrc) {
    return error(res, '标题和图片不能为空', 400);
  }

  try {
    const id = body.id || `works-${Date.now()}`;
    const d = worksToDb(body);

    await db.execute({
      sql: `INSERT INTO featured_works (id, type, image_src, alt_text, title, description, tag, details_link)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, d.type, d.image_src, d.alt_text, d.title, d.description, d.tag, d.details_link],
    });

    const result = await db.execute({ sql: 'SELECT * FROM featured_works WHERE id = ?', args: [id] });
    json(res, worksFromDb(result.rows[0]), 201);
  } catch (err) {
    console.error('Works POST error:', err);
    error(res, '创建作品失败');
  }
}
