import bcrypt from 'bcryptjs';
import { getDb } from './lib/db.js';
import { createToken, setAuthCookie } from './lib/auth.js';
import { json, error, requireMethod } from './lib/response.js';

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export default async function handler(req, res) {
  if (!requireMethod(req, res, 'POST')) return;

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const record = loginAttempts.get(ip);
  if (record && Date.now() - record.first < LOCKOUT_MS && record.count >= MAX_ATTEMPTS) {
    return error(res, '尝试次数过多，请15分钟后再试', 429);
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return error(res, '请输入用户名和密码', 400);
  }

  try {
    const db = getDb();
    const result = await db.execute('SELECT username, password_hash FROM auth_config WHERE id = 1');
    const config = result.rows[0];

    if (!config || config.username !== username || !bcrypt.compareSync(password, config.password_hash)) {
      // Record failed attempt
      if (!record || Date.now() - record.first > LOCKOUT_MS) {
        loginAttempts.set(ip, { count: 1, first: Date.now() });
      } else {
        record.count++;
      }
      return error(res, '用户名或密码错误', 401);
    }

    // Clear attempts on success
    loginAttempts.delete(ip);

    const token = await createToken(username);
    setAuthCookie(res, token);
    json(res, { message: '登录成功' });
  } catch (err) {
    console.error('Login error:', err);
    error(res, '服务器错误', 500);
  }
}
