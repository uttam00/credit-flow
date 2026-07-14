import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getBalanceHandler, getLedgerHandler } from '../controllers/walletController';

const router = Router();

router.use(requireAuth);
router.get('/balance', getBalanceHandler);
router.get('/ledger', getLedgerHandler);

export default router;
