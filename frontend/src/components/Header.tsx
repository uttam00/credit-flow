import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CampaignIcon from '@mui/icons-material/Campaign';
import { useAuth } from '../hooks/useAuth';
import { getBalances } from '../services/wallet';
import type { CurrencyBalance } from '../types/wallet';

function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [balances, setBalances] = useState<CurrencyBalance[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!user) {
      setBalances([]);
      return;
    }
    getBalances()
      .then(setBalances)
      .catch(() => setBalances([]));
  }, [user, location.pathname]);

  return (
    <AppBar position="static" color="default" sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar sx={{ gap: 1 }}>
        <AccountBalanceWalletIcon color="primary" />
        <Typography
          variant="h6"
          component={RouterLink}
          to={user ? '/wallet' : '/login'}
          sx={{ textDecoration: 'none', color: 'text.primary', fontWeight: 700, mr: 2 }}
        >
          Credit Flow
        </Typography>

        {user && (
          <>
            <Button
              component={RouterLink}
              to="/wallet"
              startIcon={<AccountBalanceWalletIcon />}
              color={location.pathname === '/wallet' ? 'primary' : 'inherit'}
            >
              Wallet
            </Button>
            <Button
              component={RouterLink}
              to="/campaigns"
              startIcon={<CampaignIcon />}
              color={location.pathname.startsWith('/campaigns') ? 'primary' : 'inherit'}
            >
              Campaigns
            </Button>
          </>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {user && (
          <>
            <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {balances.map((balance) => (
                <Chip
                  key={balance.currencyId}
                  label={`${balance.currencyName.replace(' Credits', '')}: ${balance.balanceInCredits}`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Stack>

            <IconButton onClick={(event) => setAnchorEl(event.currentTarget)} size="small" sx={{ ml: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                {user.email[0]?.toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem disabled sx={{ opacity: '1 !important' }}>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  logout();
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Log out
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Header;
