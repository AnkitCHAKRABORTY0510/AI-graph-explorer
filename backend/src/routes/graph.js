import { Router } from 'express';
import { executeGraph } from '../controllers/graphController.js';

const router = Router();

router.post('/execute', executeGraph);

export default router;
