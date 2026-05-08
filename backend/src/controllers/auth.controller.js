import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authCookieOptions, createToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  firstName: user.firstName || '',
  lastName: user.lastName || '',
  phone: user.phone || '',
  companyName: user.companyName || '',
  businessAddress: user.businessAddress || '',
  city: user.city || '',
  state: user.state || '',
  zipcode: user.zipcode || '',
  serviceAreas: user.serviceAreas || [],
  categories: user.categories || []
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

const validateServiceArea = (item) => {
  return item && item.locationId && item.location && (item.mode === 'include' || item.mode === 'exclude');
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

export const signUpOnboarding = asyncHandler(async (req, res) => {
  const firstName = String(req.body.firstName || '').trim();
  const lastName = String(req.body.lastName || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').trim();
  const companyName = String(req.body.companyName || '').trim();
  const businessAddress = String(req.body.businessAddress || '').trim();
  const city = String(req.body.city || '').trim();
  const state = String(req.body.state || '').trim();
  const zipcode = String(req.body.zipcode || '').trim();
  const acceptedTerms = Boolean(req.body.acceptedTerms);
  const serviceAreas = Array.isArray(req.body.serviceAreas) ? req.body.serviceAreas : [];
  const categories = Array.isArray(req.body.categories) ? req.body.categories : [];

  if (!firstName || !lastName || !email || !phone || !companyName || !businessAddress || !city || !state || !zipcode || !acceptedTerms) {
    const error = new Error('All business information fields and agreement acceptance are required');
    error.statusCode = 400;
    throw error;
  }

  if (!serviceAreas.length || !serviceAreas.every(validateServiceArea)) {
    const error = new Error('At least one service area must be included or excluded with a valid location');
    error.statusCode = 400;
    throw error;
  }

  if (!categories.length || !categories.every(item => item && item.categoryId && item.name)) {
    const error = new Error('At least one service category must be selected');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email }).select('_id');
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    email,
    role: 'user',
    status: 'pending',
    phone,
    companyName,
    businessAddress,
    city,
    state,
    zipcode,
    acceptedTerms,
    serviceAreas,
    categories
  });

  setAuthCookie(res, user);
  res.status(201).json({ user: publicUser(user) });
});

export const setPassword = asyncHandler(async (req, res) => {
  const password = String(req.body.password || '');

  validatePassword(password);

  const user = await User.findById(req.user._id).select('+passwordHash status');
  if (!user) {
    const error = new Error('Unable to locate user');
    error.statusCode = 404;
    throw error;
  }

  if (user.status !== 'pending') {
    const error = new Error('Password setup is only allowed for pending accounts');
    error.statusCode = 400;
    throw error;
  }

  user.passwordHash = hashPassword(password);
  await user.save();

  res.json({ message: 'Password set successfully' });
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
  const hasPassword = !!user?.passwordHash;
  if (!user || !hasPassword || !verifyPassword(password, user.passwordHash)) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== 'active') {
    const error = new Error(user.status === 'pending' ? 'Account pending approval' : 'User account is not active');
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
