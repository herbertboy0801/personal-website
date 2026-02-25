import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'auth_token';
const MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return new TextEncoder().encode(secret);
}

export async function createToken(username) {
  return new SignJWT({ sub: username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

export function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax; Secure`
  );
}

export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`
  );
}

export function parseCookie(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...rest] = c.trim().split('=');
      return [key, rest.join('=')];
    })
  );
}

export async function requireAuth(req, res) {
  const cookies = parseCookie(req.headers.cookie);
  const token = cookies[COOKIE_NAME];

  if (!token) {
    res.status(401).json({ message: '请先登录' });
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    res.status(401).json({ message: '登录已过期，请重新登录' });
    return null;
  }

  return payload;
}
