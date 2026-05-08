import { Router } from 'express';
import { getCurrentUser, login, logout, signUp, signUpOnboarding, setPassword } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/signup', signUp);
router.post('/onboarding', signUpOnboarding);
router.post('/set-password', requireAuth, setPassword);
router.post('/login', login);
router.get('/me', requireAuth, getCurrentUser);
router.post('/logout', logout);

export default router;
