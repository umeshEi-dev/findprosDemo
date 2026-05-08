import { Router } from 'express';
import { getCurrentUser, login, logout, signUp } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/signup', signUp);
router.post('/login', login);
router.get('/me', requireAuth, getCurrentUser);
router.post('/logout', logout);

export default router;
