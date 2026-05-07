import {Router} from 'express';
import { getLocation } from '../controllers/location.controller.js';

const router = Router();

router.route('/get-location').get(getLocation);

export default router;