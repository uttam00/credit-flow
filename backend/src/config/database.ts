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

const baseDatabaseName = requireEnv('DB_NAME', 'credit_flow');
const isTestEnv = process.env.NODE_ENV === 'test';

export const databaseConfig: DatabaseConfig = {
  host: requireEnv('DB_HOST', 'localhost'),
  port: Number(requireEnv('DB_PORT', '3306')),
  username: requireEnv('DB_USER', 'root'),
  password: process.env.DB_PASSWORD ?? '',
  // Mirrors src/config/config.js's "test" environment: same credentials,
  // an isolated database so tests never touch development data.
  database: isTestEnv ? (process.env.DB_NAME_TEST ?? `${baseDatabaseName}_test`) : baseDatabaseName,
};
