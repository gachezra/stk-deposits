
import { Router } from 'express';
import { mpesaCallback } from '../controllers/controllers.lipanampesa.js';

const router = Router();

router.post('/mpesaCallback/:userId', mpesaCallback);

export default router;
