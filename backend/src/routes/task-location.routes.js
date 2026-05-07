import { Router } from 'express';
import { createTaskLocation, getTaskLocationsByCategory } from '../controllers/task-location.controller.js';

const router = Router();

router.route('/task-location')
  .get(getTaskLocationsByCategory)
  .post(createTaskLocation);

export default router;