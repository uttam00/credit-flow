import { Routes, Route } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Wallet from './pages/Wallet';
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
    </Routes>
  );
}

export default App;
