import { Router } from 'express';
import aiController from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/translate', aiController.translateMessage.bind(aiController));

export default router;
