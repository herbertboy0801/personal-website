import { getDb } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import { json, error, requireMethod } from '../lib/response.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, 'POST')) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  const { featuredIds } = req.body || {};
  if (!Array.isArray(featuredIds)) {
    return error(res, 'featuredIds 必须是数组', 400);
  }

  try {
    const db = getDb();
    // Reset all featured flags
    await db.execute('UPDATE blog_posts SET featured = 0');
    // Set featured for specified IDs
    if (featuredIds.length > 0) {
      const placeholders = featuredIds.map(() => '?').join(',');
      await db.execute({
        sql: `UPDATE blog_posts SET featured = 1 WHERE id IN (${placeholders})`,
        args: featuredIds,
      });
    }
    json(res, { message: '精选更新成功', count: featuredIds.length });
  } catch (err) {
    console.error('Blog featured error:', err);
    error(res, '更新精选失败');
  }
}
