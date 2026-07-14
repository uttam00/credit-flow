import request from 'supertest';
import { app } from '../app';
import { sequelize } from '../database/sequelize';
import { WalletBalance } from '../models/WalletBalance';
import { Campaign } from '../models/Campaign';
import { InvalidCurrencyModuleError, validateCurrencyBelongsToModule } from '../services/walletService';
import { createTestUser, getCurrencyIdByModule, setBalance, TestUser } from './helpers';

async function createCampaign(user: TestUser, name: string): Promise<number> {
  const response = await request(app)
    .post('/campaigns')
    .set('Authorization', `Bearer ${user.token}`)
    .send({ name });
  return response.body.campaign.id as number;
}

function fundCampaign(user: TestUser, campaignId: number, amountInCredits: number) {
  return request(app)
    .post(`/campaigns/${campaignId}/fund`)
    .set('Authorization', `Bearer ${user.token}`)
    .send({ amountInCredits });
}

describe('Campaign funding', () => {
  afterAll(async () => {
    await sequelize.close();
  });

  test('two concurrent fund requests cannot together over-spend the balance', async () => {
    const user = await createTestUser('fund-race');
    const campaignCurrencyId = await getCurrencyIdByModule('CAMPAIGN');
    await setBalance(user.userId, campaignCurrencyId, 100);

    const campaign1Id = await createCampaign(user, 'Race Campaign 1');
    const campaign2Id = await createCampaign(user, 'Race Campaign 2');

    const [result1, result2] = await Promise.all([
      fundCampaign(user, campaign1Id, 60),
      fundCampaign(user, campaign2Id, 60),
    ]);
    const statuses = [result1.status, result2.status].sort((a, b) => a - b);

    expect(statuses).toEqual([200, 422]);

    const balance = await WalletBalance.findOne({
      where: { userId: user.userId, currencyId: campaignCurrencyId },
    });
    expect(balance?.balanceInCredits).toBe(40);
    expect(balance!.balanceInCredits).toBeGreaterThanOrEqual(0);
  });

  test('a Report Credits balance can never fund a campaign (currency isolation)', async () => {
    const user = await createTestUser('fund-wrong-currency');
    const campaignCurrencyId = await getCurrencyIdByModule('CAMPAIGN');
    const reportCurrencyId = await getCurrencyIdByModule('REPORT');
    await setBalance(user.userId, reportCurrencyId, 100);
    await setBalance(user.userId, campaignCurrencyId, 0);

    const campaignId = await createCampaign(user, 'Wrong Currency Campaign');

    // Campaigns are always bound to Campaign Credits (createCampaign never
    // accepts a currency choice), so a Report Credits balance is simply
    // never consulted: funding fails as "insufficient balance" against a
    // Campaign Credits balance of 0, regardless of how large the Report
    // Credits balance is.
    const fundResponse = await fundCampaign(user, campaignId, 50);
    expect(fundResponse.status).toBe(422);

    const campaignCreditsBalance = await WalletBalance.findOne({
      where: { userId: user.userId, currencyId: campaignCurrencyId },
    });
    const reportCreditsBalance = await WalletBalance.findOne({
      where: { userId: user.userId, currencyId: reportCurrencyId },
    });
    expect(campaignCreditsBalance?.balanceInCredits).toBe(0);
    expect(reportCreditsBalance?.balanceInCredits).toBe(100);
  });

  test('campaign currency binding is enforced by both the DB trigger and the service-layer guard', async () => {
    const user = await createTestUser('fund-binding-guard');
    const campaignCurrencyId = await getCurrencyIdByModule('CAMPAIGN');
    const reportCurrencyId = await getCurrencyIdByModule('REPORT');
    const campaignId = await createCampaign(user, 'Binding Guard Campaign');

    // Schema-level guard: a direct attempt to rebind this campaign to a
    // non-CAMPAIGN currency must be rejected by the DB trigger, even
    // bypassing the application entirely.
    await expect(Campaign.update({ currencyId: reportCurrencyId }, { where: { id: campaignId } })).rejects.toThrow();

    // Service-level guard: the same validation fundCampaign relies on must
    // independently reject a Report Credits currency for the CAMPAIGN
    // module, proving this isn't solely dependent on the trigger.
    await expect(validateCurrencyBelongsToModule(reportCurrencyId, 'CAMPAIGN')).rejects.toThrow(
      InvalidCurrencyModuleError,
    );

    const campaign = await Campaign.findByPk(campaignId);
    expect(campaign?.currencyId).toBe(campaignCurrencyId);
  });

  test('insufficient balance is rejected and leaves the balance and campaign untouched', async () => {
    const user = await createTestUser('fund-insufficient');
    const campaignCurrencyId = await getCurrencyIdByModule('CAMPAIGN');
    await setBalance(user.userId, campaignCurrencyId, 50);

    const campaignId = await createCampaign(user, 'Insufficient Balance Campaign');

    const fundResponse = await fundCampaign(user, campaignId, 60);
    expect(fundResponse.status).toBe(422);

    const balance = await WalletBalance.findOne({
      where: { userId: user.userId, currencyId: campaignCurrencyId },
    });
    expect(balance?.balanceInCredits).toBe(50);

    const campaign = await Campaign.findByPk(campaignId);
    expect(campaign?.status).toBe('CREATED');
    expect(campaign?.fundedAmountInCredits).toBe(0);
  });
});
