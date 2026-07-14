import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listCurrenciesHandler } from '../controllers/currencyController';

const router = Router();

router.use(requireAuth);
router.get('/', listCurrenciesHandler);

export default router;
