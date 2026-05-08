import { createHmac, timingSafeEqual } from 'crypto';

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const JWT_SECRET = process.env.JWT_SECRET || 'findpros-development-secret-change-me';

const base64UrlEncode = (value) => Buffer
  .from(JSON.stringify(value))
  .toString('base64url');

const base64UrlDecode = (value) => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

const sign = (value) => createHmac('sha256', JWT_SECRET).update(value).digest('base64url');

export const createToken = (payload, ttlSeconds = TOKEN_TTL_SECONDS) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds
  };
  const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(body)}`;

  return `${unsignedToken}.${sign(unsignedToken)}`;
};

export const verifyToken = (token) => {
  const [encodedHeader, encodedPayload, signature] = String(token || '').split('.');

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Invalid token');
  }

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = sign(unsignedToken);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new Error('Invalid token signature');
  }

  const payload = base64UrlDecode(encodedPayload);
  const now = Math.floor(Date.now() / 1000);

  if (!payload.exp || payload.exp < now) {
    throw new Error('Token expired');
  }

  return payload;
};

export const authCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: TOKEN_TTL_SECONDS * 1000,
  path: '/'
});
