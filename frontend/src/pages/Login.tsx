import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token, user } = await login(email, password);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/wallet');
    } catch {
      setError('Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Log in</h1>
      {error && <p role="alert">{error}</p>}
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      <button type="submit" disabled={submitting}>
        Log in
      </button>
    </form>
  );
}

export default Login;
