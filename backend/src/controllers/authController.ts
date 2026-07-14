import { Request, Response } from 'express';
import { signup, login, EmailAlreadyRegisteredError, InvalidCredentialsError } from '../services/authService';
import { User } from '../models/User';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && EMAIL_PATTERN.test(value);
}

export async function signupHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: unknown; password?: unknown };

  if (!isValidEmail(email) || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({
      error: `A valid email and a password of at least ${MIN_PASSWORD_LENGTH} characters are required`,
    });
    return;
  }

  try {
    const user = await signup(email, password);
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: unknown; password?: unknown };

  if (!isValidEmail(email) || typeof password !== 'string' || password.length === 0) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const { token, user } = await login(email, password);
    res.status(200).json({ token, user });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function meHandler(req: Request, res: Response): Promise<void> {
  const user = await User.findByPk(req.user!.userId);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  res.status(200).json({ user: { id: user.id, email: user.email } });
}
