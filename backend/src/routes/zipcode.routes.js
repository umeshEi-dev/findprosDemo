import { Router } from 'express';
import { getZipCodes } from '../controllers/zipcode.controller.js';

const router = Router();

router.route('/get-zipcode').get(getZipCodes);

export default router;
