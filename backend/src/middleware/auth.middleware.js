import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/jwt.js';

const getCookieValue = (cookieHeader, name) => {
  const cookies = String(cookieHeader || '').split(';');
  const cookie = cookies.find((item) => item.trim().startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : '';
};

const getBearerToken = (authorizationHeader) => {
  const [scheme, token] = String(authorizationHeader || '').split(' ');

  return scheme?.toLowerCase() === 'bearer' ? token : '';
};

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = getCookieValue(req.headers.cookie, 'findpros_token') || getBearerToken(req.headers.authorization);

  if (!token) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    const error = new Error('Invalid or expired session');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(payload.sub).select('_id name email role status');

  if (!user || user.status !== 'active') {
    const error = new Error('User account is not active');
    error.statusCode = 401;
    throw error;
  }

  req.user = user;
  next();
});

export const requireRoles = (...roles) => (req, _res, next) => {
  if (!roles.length || roles.includes(req.user?.role)) {
    next();
    return;
  }

  const error = new Error('You do not have permission to access this resource');
  error.statusCode = 403;
  next(error);
};
