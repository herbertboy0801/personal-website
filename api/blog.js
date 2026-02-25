import { getDb } from './lib/db.js';
import { requireAuth } from './lib/auth.js';
import { json, error } from './lib/response.js';
import { blogFromDb, blogToDb } from './lib/transformers.js';

export default async function handler(req, res) {
  const db = getDb();
  const { id, action } = req.query;

  // POST /api/blog/featured → rewritten to /api/blog?action=featured
  if (req.method === 'POST' && action === 'featured') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { featuredIds } = req.body || {};
    if (!Array.isArray(featuredIds)) {
      return error(res, 'featuredIds 必须是数组', 400);
    }

    try {
      await db.execute('UPDATE blog_posts SET featured = 0');
      if (featuredIds.length > 0) {
        const placeholders = featuredIds.map(() => '?').join(',');
        await db.execute({
          sql: `UPDATE blog_posts SET featured = 1 WHERE id IN (${placeholders})`,
          args: featuredIds,
        });
      }
      return json(res, { message: '精选更新成功', count: featuredIds.length });
    } catch (err) {
      console.error('Blog featured error:', err);
      return error(res, '更新精选失败');
    }
  }

  // PUT /api/blog/:id → rewritten to /api/blog?id=xxx
  if (req.method === 'PUT') {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (!id) return error(res, '缺少文章ID', 400);

    const body = req.body;
    if (!body || !body.title) return error(res, '标题不能为空', 400);

    try {
      const d = blogToDb(body);
      await db.execute({
        sql: `UPDATE blog_posts SET source=?, title=?, summary=?, link=?, featured=?, date=?, category=?, tags=?, day_number=?, read_time=?, difficulty=?, updated_at=datetime('now')
              WHERE id = ?`,
        args: [d.source, d.title, d.summary, d.link, d.featured, d.date, d.category, d.tags, d.day_number, d.read_time, d.difficulty, id],
      });

      const result = await db.execute({ sql: 'SELECT * FROM blog_posts WHERE id = ?', args: [id] });
      if (!result.rows[0]) return error(res, '文章不存在', 404);
      return json(res, blogFromDb(result.rows[0]));
    } catch (err) {
      console.error('Blog PUT error:', err);
      return error(res, '更新失败');
    }
  }

  // DELETE /api/blog/:id
  if (req.method === 'DELETE') {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (!id) return error(res, '缺少文章ID', 400);

    try {
      await db.execute({ sql: 'DELETE FROM blog_posts WHERE id = ?', args: [id] });
      return json(res, { message: '删除成功' });
    } catch (err) {
      console.error('Blog DELETE error:', err);
      return error(res, '删除失败');
    }
  }

  // GET /api/blog
  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT * FROM blog_posts ORDER BY date DESC');
      return json(res, result.rows.map(blogFromDb));
    } catch (err) {
      console.error('Blog GET error:', err);
      return error(res, '获取文章失败');
    }
  }

  // POST /api/blog (create)
  if (req.method === 'POST') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const body = req.body;
    if (!body || !body.title) return error(res, '标题不能为空', 400);

    try {
      const postId = body.id || `blog-${Date.now()}`;
      const d = blogToDb(body);

      await db.execute({
        sql: `INSERT INTO blog_posts (id, source, title, summary, link, featured, date, category, tags, day_number, read_time, difficulty)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [postId, d.source, d.title, d.summary, d.link, d.featured, d.date, d.category, d.tags, d.day_number, d.read_time, d.difficulty],
      });

      const result = await db.execute({ sql: 'SELECT * FROM blog_posts WHERE id = ?', args: [postId] });
      return json(res, blogFromDb(result.rows[0]), 201);
    } catch (err) {
      console.error('Blog POST error:', err);
      return error(res, '创建文章失败');
    }
  }

  res.setHeader('Allow', 'GET, POST, PUT, DELETE');
  return error(res, `Method ${req.method} not allowed`, 405);
}
