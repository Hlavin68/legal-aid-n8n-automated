import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { submitTriage } from '../controllers/triageController.js';

const router = express.Router();

router.post('/', authenticate, authorize(['client']), submitTriage);

export default router;
