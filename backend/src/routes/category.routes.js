import { Router } from 'express';
import { createCategory, getCategories } from '../controllers/category.controller.js';

const router = Router();

router.route('/').get(getCategories).post(createCategory);

export default router;
