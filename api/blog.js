import { getDb } from './lib/db.js';
import { requireAuth } from './lib/auth.js';
import { json, error, requireMethod } from './lib/response.js';
import { blogFromDb, blogToDb } from './lib/transformers.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;

  const db = getDb();

  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT * FROM blog_posts ORDER BY date DESC');
      json(res, result.rows.map(blogFromDb));
    } catch (err) {
      console.error('Blog GET error:', err);
      error(res, '获取文章失败');
    }
    return;
  }

  // POST - requires auth
  const user = await requireAuth(req, res);
  if (!user) return;

  const body = req.body;
  if (!body || !body.title) {
    return error(res, '标题不能为空', 400);
  }

  try {
    const id = body.id || `blog-${Date.now()}`;
    const d = blogToDb(body);

    await db.execute({
      sql: `INSERT INTO blog_posts (id, source, title, summary, link, featured, date, category, tags, day_number, read_time, difficulty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, d.source, d.title, d.summary, d.link, d.featured, d.date, d.category, d.tags, d.day_number, d.read_time, d.difficulty],
    });

    const result = await db.execute({ sql: 'SELECT * FROM blog_posts WHERE id = ?', args: [id] });
    json(res, blogFromDb(result.rows[0]), 201);
  } catch (err) {
    console.error('Blog POST error:', err);
    error(res, '创建文章失败');
  }
}
