import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createCampaignHandler,
  listCampaignsHandler,
  fundCampaignHandler,
} from '../controllers/campaignController';

const router = Router();

router.use(requireAuth);
router.post('/', createCampaignHandler);
router.get('/', listCampaignsHandler);
router.post('/:id/fund', fundCampaignHandler);

export default router;
