import bcrypt from 'bcryptjs';
import { getDb } from '../lib/db.js';
import { createToken, setAuthCookie, clearAuthCookie, parseCookie, verifyToken, requireAuth } from '../lib/auth.js';
import { json, error } from '../lib/response.js';

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export default async function handler(req, res) {
  const { action } = req.query;

  // GET /api/auth-status → /api/auth?action=status
  if (action === 'status') {
    const cookies = parseCookie(req.headers.cookie);
    const token = cookies.auth_token;
    if (!token) return json(res, { authenticated: false });
    const payload = await verifyToken(token);
    return json(res, { authenticated: !!payload, username: payload?.sub });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return error(res, `Method ${req.method} not allowed`, 405);
  }

  // POST /api/login → /api/auth?action=login
  if (action === 'login') {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const record = loginAttempts.get(ip);
    if (record && Date.now() - record.first < LOCKOUT_MS && record.count >= MAX_ATTEMPTS) {
      return error(res, '尝试次数过多，请15分钟后再试', 429);
    }

    const { username, password } = req.body || {};
    if (!username || !password) return error(res, '请输入用户名和密码', 400);

    try {
      const db = getDb();
      const result = await db.execute('SELECT username, password_hash FROM auth_config WHERE id = 1');
      const config = result.rows[0];

      if (!config || config.username !== username || !bcrypt.compareSync(password, config.password_hash)) {
        if (!record || Date.now() - record.first > LOCKOUT_MS) {
          loginAttempts.set(ip, { count: 1, first: Date.now() });
        } else {
          record.count++;
        }
        return error(res, '用户名或密码错误', 401);
      }

      loginAttempts.delete(ip);
      const token = await createToken(username);
      setAuthCookie(res, token);
      return json(res, { message: '登录成功' });
    } catch (err) {
      console.error('Login error:', err);
      return error(res, '服务器错误', 500);
    }
  }

  // POST /api/logout → /api/auth?action=logout
  if (action === 'logout') {
    clearAuthCookie(res);
    return json(res, { message: '已登出' });
  }

  // POST /api/change-password → /api/auth?action=change-password
  if (action === 'change-password') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return error(res, '请输入当前密码和新密码', 400);
    if (newPassword.length < 6) return error(res, '新密码至少6位', 400);

    try {
      const db = getDb();
      const result = await db.execute('SELECT password_hash FROM auth_config WHERE id = 1');
      const config = result.rows[0];

      if (!config || !bcrypt.compareSync(currentPassword, config.password_hash)) {
        return error(res, '当前密码错误', 401);
      }

      const newHash = bcrypt.hashSync(newPassword, 10);
      await db.execute({
        sql: "UPDATE auth_config SET password_hash = ?, updated_at = datetime('now') WHERE id = 1",
        args: [newHash],
      });

      return json(res, { message: '密码修改成功' });
    } catch (err) {
      console.error('Change password error:', err);
      return error(res, '服务器错误', 500);
    }
  }

  return error(res, '未知操作', 400);
}
