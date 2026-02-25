import { parseCookie, verifyToken } from './lib/auth.js';
import { json } from './lib/response.js';

export default async function handler(req, res) {
  const cookies = parseCookie(req.headers.cookie);
  const token = cookies.auth_token;

  if (!token) {
    return json(res, { authenticated: false });
  }

  const payload = await verifyToken(token);
  json(res, { authenticated: !!payload, username: payload?.sub });
}
