import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import AddCardIcon from '@mui/icons-material/AddCard';
import CampaignIcon from '@mui/icons-material/Campaign';
import { getBalances, getLedger } from '../services/wallet';
import type { CurrencyBalance, LedgerEntry } from '../types/wallet';

function Wallet() {
  const [balances, setBalances] = useState<CurrencyBalance[]>([]);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBalances()
      .then((data) => {
        setBalances(data);
        if (data.length > 0) {
          setSelectedCurrencyId(data[0].currencyId);
        }
      })
      .catch(() => setError('Failed to load wallet balances'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCurrencyId === null) {
      return;
    }
    getLedger(selectedCurrencyId)
      .then((page) => setLedger(page.entries))
      .catch(() => setError('Failed to load ledger'));
  }, [selectedCurrencyId]);

  if (loading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="text" width={160} height={48} />
        <Grid container spacing={2}>
          {[1, 2, 3].map((key) => (
            <Grid key={key} size={{ xs: 12, sm: 4 }}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      </Stack>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Wallet
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/buy" variant="contained" startIcon={<AddCardIcon />}>
            Buy Credits
          </Button>
          <Button component={RouterLink} to="/campaigns" variant="outlined" startIcon={<CampaignIcon />}>
            Campaigns
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {balances.map((balance) => (
          <Grid key={balance.currencyId} size={{ xs: 12, sm: 4 }}>
            <Card
              variant="outlined"
              data-testid={`balance-card-${balance.currencyId}`}
              sx={{
                borderColor: balance.currencyId === selectedCurrencyId ? 'primary.main' : undefined,
                borderWidth: balance.currencyId === selectedCurrencyId ? 2 : 1,
              }}
            >
              <CardActionArea onClick={() => setSelectedCurrencyId(balance.currencyId)}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {balance.currencyName}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {balance.balanceInCredits}
                  </Typography>
                  <Chip label={balance.module} size="small" sx={{ mt: 1 }} />
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Ledger
      </Typography>

      <Paper variant="outlined">
        <Tabs
          value={selectedCurrencyId ?? false}
          onChange={(_event, value: number) => setSelectedCurrencyId(value)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          {balances.map((balance) => (
            <Tab key={balance.currencyId} value={balance.currencyId} label={balance.currencyName} />
          ))}
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledger.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No ledger entries yet
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                ledger.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={entry.reason}
                        size="small"
                        color={entry.reason === 'PURCHASE' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: entry.amountInCredits >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}
                    >
                      {entry.amountInCredits >= 0 ? '+' : ''}
                      {entry.amountInCredits}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default Wallet;
