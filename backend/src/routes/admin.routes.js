import { Router } from 'express';
import { activateUser, getPendingUsers } from '../controllers/admin.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireRoles('admin'));
router.get('/users/pending', getPendingUsers);
router.post('/users/:id/activate', activateUser);

export default router;
