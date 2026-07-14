import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UniqueConstraintError } from 'sequelize';
import { sequelize } from '../database/sequelize';
import { User } from '../models/User';
import { initializeWallet } from './walletService';

const SALT_ROUNDS = 12;

export interface AuthenticatedUser {
  id: number;
  email: string;
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('Email is already registered');
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

export async function signup(email: string, password: string): Promise<AuthenticatedUser> {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    return await sequelize.transaction(async (transaction) => {
      const user = await User.create({ email, passwordHash }, { transaction });
      await initializeWallet(user.id, transaction);
      return { id: user.id, email: user.email };
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new EmailAlreadyRegisteredError();
    }
    throw error;
  }
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: AuthenticatedUser }> {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new InvalidCredentialsError();
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new InvalidCredentialsError();
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '1d') as SignOptions['expiresIn'];
  const token = jwt.sign({ userId: user.id, email: user.email }, getJwtSecret(), { expiresIn });

  return { token, user: { id: user.id, email: user.email } };
}
