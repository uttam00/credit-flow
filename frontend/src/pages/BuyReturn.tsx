import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';

function BuyReturn() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 2, sm: 8 } }}>
      <Paper variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <CheckCircleOutlineIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
          Thanks!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Credits are only granted once Stripe confirms your payment — this can take a few seconds.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Check your wallet to see your updated balance.
        </Typography>
        <Button component={RouterLink} to="/wallet" variant="contained">
          Go to wallet
        </Button>
      </Paper>
    </Box>
  );
}

export default BuyReturn;
