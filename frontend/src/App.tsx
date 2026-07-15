import { Routes, Route } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Wallet from './pages/Wallet';
import BuyReturn from './pages/BuyReturn';
import Campaigns from './pages/Campaigns';
import BuyCredits from './components/BuyCredits';
import RequireAuth from './components/RequireAuth';
import Header from './components/Header';

function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/wallet"
            element={
              <RequireAuth>
                <Wallet />
              </RequireAuth>
            }
          />
          <Route
            path="/buy"
            element={
              <RequireAuth>
                <BuyCredits />
              </RequireAuth>
            }
          />
          <Route
            path="/buy/return"
            element={
              <RequireAuth>
                <BuyReturn />
              </RequireAuth>
            }
          />
          <Route
            path="/campaigns"
            element={
              <RequireAuth>
                <Campaigns />
              </RequireAuth>
            }
          />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
