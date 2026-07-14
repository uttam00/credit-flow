import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function NavBar() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <nav>
      <Link to="/wallet">Wallet</Link> | <Link to="/campaigns">Campaigns</Link>
      <span> — {user.email} </span>
      <button type="button" onClick={logout}>
        Log out
      </button>
    </nav>
  );
}

export default NavBar;
