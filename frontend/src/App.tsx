import { Routes, Route } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Wallet from './pages/Wallet';
import BuyReturn from './pages/BuyReturn';
import BuyCredits from './components/BuyCredits';
import RequireAuth from './components/RequireAuth';

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Credit Flow</div>} />
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
    </Routes>
  );
}

export default App;
