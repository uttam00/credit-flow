import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { sequelize } from './database/sequelize';
import './models';
import authRoutes from './routes/auth';
import walletRoutes from './routes/wallet';
import paymentRoutes from './routes/payment';
import campaignRoutes from './routes/campaigns';
import currencyRoutes from './routes/currencies';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());

// Mounted before the global JSON body parser: the webhook route needs the
// raw, unparsed body to verify Stripe's signature, and each route in
// paymentRoutes declares its own body parser rather than relying on one
// applied here.
app.use(paymentRoutes);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/wallet', walletRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/currencies', currencyRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

start();
