import { clearAuthCookie } from './lib/auth.js';
import { json, requireMethod } from './lib/response.js';

export default async function handler(req, res) {
  if (!requireMethod(req, res, 'POST')) return;
  clearAuthCookie(res);
  json(res, { message: '已登出' });
}
