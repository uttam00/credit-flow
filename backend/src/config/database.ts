import 'dotenv/config';

interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const databaseConfig: DatabaseConfig = {
  host: requireEnv('DB_HOST', 'localhost'),
  port: Number(requireEnv('DB_PORT', '3306')),
  username: requireEnv('DB_USER', 'root'),
  password: process.env.DB_PASSWORD ?? '',
  database: requireEnv('DB_NAME', 'credit_flow'),
};
