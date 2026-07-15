import { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import { listCampaigns, createCampaign, fundCampaign } from '../services/campaigns';
import type { Campaign } from '../types/campaign';
import {
  createCampaignSchema,
  fundCampaignSchema,
  type CreateCampaignFormValues,
  type FundCampaignFormValues,
} from '../validation/campaignSchemas';

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

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [fundingCampaign, setFundingCampaign] = useState<Campaign | null>(null);
  const [fundError, setFundError] = useState<string | null>(null);

  const createForm = useForm<CreateCampaignFormValues>({
    resolver: yupResolver(createCampaignSchema),
    defaultValues: { name: '' },
  });

  const fundForm = useForm<FundCampaignFormValues>({
    resolver: yupResolver(fundCampaignSchema),
    defaultValues: { amountInCredits: 1 },
  });

  function refresh() {
    setLoading(true);
    listCampaigns()
      .then(setCampaigns)
      .catch(() => setError('Failed to load campaigns'))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function onCreate(values: CreateCampaignFormValues) {
    try {
      await createCampaign(values.name.trim());
      createForm.reset();
      setShowCreateDialog(false);
      refresh();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to create campaign'));
    }
  }

  async function onFund(values: FundCampaignFormValues) {
    if (fundingCampaign === null) {
      return;
    }
    setFundError(null);
    try {
      await fundCampaign(fundingCampaign.id, values.amountInCredits);
      fundForm.reset();
      setFundingCampaign(null);
      refresh();
    } catch (err) {
      setFundError(extractErrorMessage(err, 'Failed to fund campaign'));
    }
  }

  if (loading) {
    return <Skeleton variant="rounded" height={320} />;
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Campaigns
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateDialog(true)}>
          New Campaign
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Funded amount</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No campaigns yet — create one to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow key={campaign.id} hover>
                  <TableCell>{campaign.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={campaign.status}
                      size="small"
                      color={campaign.status === 'FUNDED' ? 'success' : 'default'}
                      variant={campaign.status === 'FUNDED' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="right">{campaign.fundedAmountInCredits}</TableCell>
                  <TableCell align="right">
                    {campaign.status === 'CREATED' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setFundError(null);
                          fundForm.reset({ amountInCredits: 1 });
                          setFundingCampaign(campaign);
                        }}
                      >
                        Fund
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        aria-labelledby="create-campaign-title"
        fullWidth
        maxWidth="xs"
      >
        <Box component="form" onSubmit={createForm.handleSubmit(onCreate)} noValidate>
          <DialogTitle id="create-campaign-title">Create campaign</DialogTitle>
          <DialogContent>
            <TextField
              {...createForm.register('name')}
              autoFocus
              label="Campaign name"
              fullWidth
              margin="dense"
              error={Boolean(createForm.formState.errors.name)}
              helperText={createForm.formState.errors.name?.message}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createForm.formState.isSubmitting}>
              Create
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={fundingCampaign !== null}
        onClose={() => setFundingCampaign(null)}
        aria-labelledby="fund-campaign-title"
        fullWidth
        maxWidth="xs"
      >
        <Box component="form" onSubmit={fundForm.handleSubmit(onFund)} noValidate>
          <DialogTitle id="fund-campaign-title">Fund campaign</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Funding &quot;{fundingCampaign?.name}&quot; using Campaign Credits.
            </Typography>
            {fundError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {fundError}
              </Alert>
            )}
            <TextField
              {...fundForm.register('amountInCredits', { valueAsNumber: true })}
              autoFocus
              label="Amount (credits)"
              type="number"
              fullWidth
              margin="dense"
              error={Boolean(fundForm.formState.errors.amountInCredits)}
              helperText={fundForm.formState.errors.amountInCredits?.message}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFundingCampaign(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={fundForm.formState.isSubmitting}>
              Confirm
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

export default Campaigns;
