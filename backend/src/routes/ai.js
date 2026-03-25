import { Router } from 'express';
import { interpretQuery } from '../controllers/aiController.js';

const router = Router();

router.post('/interpret', interpretQuery);

export default router;
