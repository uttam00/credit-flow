import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import './models';
import authRoutes from './routes/auth';
import walletRoutes from './routes/wallet';
import paymentRoutes from './routes/payment';
import campaignRoutes from './routes/campaigns';
import currencyRoutes from './routes/currencies';

export const app = express();

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
