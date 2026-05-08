import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authCookieOptions, createToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

const setAuthCookie = (res, user) => {
  const token = createToken({ sub: user._id.toString(), role: user.role });
  res.cookie('findpros_token', token, authCookieOptions());
};

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    const error = new Error('Password must be at least 8 characters');
    error.statusCode = 400;
    throw error;
  }
};

export const signUp = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !email) {
    const error = new Error('Name and email are required');
    error.statusCode = 400;
    throw error;
  }

  validatePassword(password);

  const existingUser = await User.findOne({ email }).select('_id');
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    passwordHash: hashPassword(password),
    role: 'user'
  });

  setAuthCookie(res, user);
  res.status(201).json({ user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email }).select('+passwordHash name email role status');
  const isValidLogin = user && user.status === 'active' && verifyPassword(password, user.passwordHash);

  if (!isValidLogin) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  setAuthCookie(res, user);
  res.json({ user: publicUser(user) });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('findpros_token', {
    ...authCookieOptions(),
    maxAge: 0
  });
  res.status(204).send();
});
