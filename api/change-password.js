import bcrypt from 'bcryptjs';
import { getDb } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import { json, error, requireMethod } from '../lib/response.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, 'POST')) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return error(res, '请输入当前密码和新密码', 400);
  }
  if (newPassword.length < 6) {
    return error(res, '新密码至少6位', 400);
  }

  try {
    const db = getDb();
    const result = await db.execute('SELECT password_hash FROM auth_config WHERE id = 1');
    const config = result.rows[0];

    if (!config || !bcrypt.compareSync(currentPassword, config.password_hash)) {
      return error(res, '当前密码错误', 401);
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.execute({
      sql: 'UPDATE auth_config SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = 1',
      args: [newHash],
    });

    json(res, { message: '密码修改成功' });
  } catch (err) {
    console.error('Change password error:', err);
    error(res, '服务器错误', 500);
  }
}
