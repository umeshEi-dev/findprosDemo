import { Router } from 'express';
import { createCategory, getCategories, updateCategory } from '../controllers/category.controller.js';
import { requireActiveAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.route('/').get(getCategories).post(requireActiveAuth, createCategory);
router.route('/:id').put(requireActiveAuth, updateCategory);

export default router;
