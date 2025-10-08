
import { Router } from 'express';
import { generateApiKey } from '../controllers/apiKeyController.js';
import { protectGeneration } from '../middlewares/protectGeneration.js';

const router = Router();

// This route is protected by a static secret header
router.post('/generate-key', protectGeneration, generateApiKey);

export default router;
