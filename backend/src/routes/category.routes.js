import { Router } from 'express';
import { createCategory, getCategories, updateCategory } from '../controllers/category.controller.js';

const router = Router();

router.route('/').get(getCategories).post(createCategory);
router.route('/:id').put(updateCategory);

export default router;
