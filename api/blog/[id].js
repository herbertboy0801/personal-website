import { getDb } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import { json, error, requireMethod } from '../lib/response.js';
import { blogFromDb, blogToDb } from '../lib/transformers.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, ['PUT', 'DELETE'])) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;
  if (!id) return error(res, '缺少文章ID', 400);

  const db = getDb();

  if (req.method === 'DELETE') {
    try {
      await db.execute({ sql: 'DELETE FROM blog_posts WHERE id = ?', args: [id] });
      json(res, { message: '删除成功' });
    } catch (err) {
      console.error('Blog DELETE error:', err);
      error(res, '删除失败');
    }
    return;
  }

  // PUT
  const body = req.body;
  if (!body || !body.title) {
    return error(res, '标题不能为空', 400);
  }

  try {
    const d = blogToDb(body);
    await db.execute({
      sql: `UPDATE blog_posts SET source=?, title=?, summary=?, link=?, featured=?, date=?, category=?, tags=?, day_number=?, read_time=?, difficulty=?, updated_at=datetime('now')
            WHERE id = ?`,
      args: [d.source, d.title, d.summary, d.link, d.featured, d.date, d.category, d.tags, d.day_number, d.read_time, d.difficulty, id],
    });

    const result = await db.execute({ sql: 'SELECT * FROM blog_posts WHERE id = ?', args: [id] });
    if (!result.rows[0]) return error(res, '文章不存在', 404);
    json(res, blogFromDb(result.rows[0]));
  } catch (err) {
    console.error('Blog PUT error:', err);
    error(res, '更新失败');
  }
}
