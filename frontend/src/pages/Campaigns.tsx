import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { listCampaigns, createCampaign, fundCampaign } from '../services/campaigns';
import type { Campaign } from '../types/campaign';

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.error === 'string') {
    return error.response.data.error;
  }
  return fallback;
}

function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const [fundingCampaignId, setFundingCampaignId] = useState<number | null>(null);
  const [fundAmount, setFundAmount] = useState(1);
  const [funding, setFunding] = useState(false);
  const [fundError, setFundError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    listCampaigns()
      .then(setCampaigns)
      .catch(() => setError('Failed to load campaigns'))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate() {
    if (newName.trim().length === 0) {
      return;
    }
    setCreating(true);
    try {
      await createCampaign(newName.trim());
      setNewName('');
      setShowCreateModal(false);
      refresh();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to create campaign'));
    } finally {
      setCreating(false);
    }
  }

  async function handleFund() {
    if (fundingCampaignId === null) {
      return;
    }
    setFunding(true);
    setFundError(null);
    try {
      await fundCampaign(fundingCampaignId, fundAmount);
      setFundingCampaignId(null);
      refresh();
    } catch (err) {
      setFundError(extractErrorMessage(err, 'Failed to fund campaign'));
    } finally {
      setFunding(false);
    }
  }

  if (loading) {
    return <p>Loading campaigns...</p>;
  }

  return (
    <div>
      <h1>Campaigns</h1>
      <Link to="/wallet">Back to wallet</Link>
      {error && <p role="alert">{error}</p>}

      <button type="button" onClick={() => setShowCreateModal(true)}>
        New Campaign
      </button>

      {showCreateModal && (
        <div role="dialog" aria-label="Create campaign">
          <label>
            Campaign name
            <input value={newName} onChange={(event) => setNewName(event.target.value)} />
          </label>
          <button type="button" onClick={handleCreate} disabled={creating}>
            Create
          </button>
          <button type="button" onClick={() => setShowCreateModal(false)}>
            Cancel
          </button>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Funded amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {campaigns.length === 0 ? (
            <tr>
              <td colSpan={4}>No campaigns yet</td>
            </tr>
          ) : (
            campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td>{campaign.name}</td>
                <td>{campaign.status}</td>
                <td>{campaign.fundedAmountInCredits}</td>
                <td>
                  {campaign.status === 'CREATED' && (
                    <button type="button" onClick={() => setFundingCampaignId(campaign.id)}>
                      Fund
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {fundingCampaignId !== null && (
        <div role="dialog" aria-label="Fund campaign">
          <p>Funded using Campaign Credits</p>
          {fundError && <p role="alert">{fundError}</p>}
          <label>
            Amount (credits)
            <input
              type="number"
              min={1}
              value={fundAmount}
              onChange={(event) => setFundAmount(Number(event.target.value))}
            />
          </label>
          <button type="button" onClick={handleFund} disabled={funding}>
            Confirm
          </button>
          <button type="button" onClick={() => setFundingCampaignId(null)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default Campaigns;
