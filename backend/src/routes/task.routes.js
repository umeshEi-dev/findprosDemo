import { Router } from 'express';
import { createTask, getTasks } from '../controllers/task.controller.js';

const router = Router();

router.route('/').get(getTasks).post(createTask);

export default router;
