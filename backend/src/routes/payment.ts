import { Router, json, raw } from 'express';
import { requireAuth } from '../middleware/auth';
import { buyHandler, webhookHandler } from '../controllers/paymentController';

const router = Router();

// The webhook route needs the raw request body to verify Stripe's signature,
// so it must never pass through a JSON body parser. This router is mounted
// before the app-level express.json() in index.ts for that reason.
router.post('/wallet/buy', requireAuth, json(), buyHandler);
router.post('/webhooks/stripe', raw({ type: 'application/json' }), webhookHandler);

export default router;
