import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Home() {
  const { token } = useAuth();
  return <Navigate to={token ? '/wallet' : '/login'} replace />;
}

export default Home;
