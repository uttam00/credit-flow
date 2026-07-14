import { Router } from 'express';
import { signupHandler, loginHandler, meHandler } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/signup', signupHandler);
router.post('/login', loginHandler);
router.get('/me', requireAuth, meHandler);

export default router;
