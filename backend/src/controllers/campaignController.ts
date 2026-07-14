import { Request, Response } from 'express';
import {
  createCampaign,
  listCampaigns,
  fundCampaign,
  CampaignNotFoundError,
  CampaignAlreadyFundedError,
  InsufficientBalanceError,
} from '../services/campaignService';
import { InvalidCurrencyModuleError } from '../services/walletService';

export async function createCampaignHandler(req: Request, res: Response): Promise<void> {
  const { name } = req.body as { name?: unknown };
  if (typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ error: 'A non-empty campaign name is required' });
    return;
  }

  const campaign = await createCampaign(req.user!.userId, name.trim());
  res.status(201).json({ campaign });
}

export async function listCampaignsHandler(req: Request, res: Response): Promise<void> {
  const campaigns = await listCampaigns(req.user!.userId);
  res.status(200).json({ campaigns });
}

export async function fundCampaignHandler(req: Request, res: Response): Promise<void> {
  const campaignId = Number(req.params.id);
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    res.status(400).json({ error: 'A valid campaign id is required' });
    return;
  }

  const { amountInCredits } = req.body as { amountInCredits?: unknown };
  if (typeof amountInCredits !== 'number' || !Number.isInteger(amountInCredits) || amountInCredits <= 0) {
    res.status(400).json({ error: 'amountInCredits must be a positive integer' });
    return;
  }

  try {
    await fundCampaign(req.user!.userId, campaignId, amountInCredits);
  } catch (error) {
    if (error instanceof CampaignNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof CampaignAlreadyFundedError) {
      res.status(409).json({ error: error.message });
      return;
    }
    if (error instanceof InsufficientBalanceError) {
      res.status(422).json({ error: error.message });
      return;
    }
    if (error instanceof InvalidCurrencyModuleError) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }

  res.status(200).json({ status: 'FUNDED' });
}
