import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

import { startAlertEngine } from './services/alertEngine.js';
import { startHRHRScanner } from './services/hrhrService.js';
import portfolioRouter from './routes/portfolio.js';
import pricesRouter from './routes/prices.js';
import newsRouter from './routes/news.js';
import adviceRouter from './routes/advice.js';
import alertsRouter from './routes/alerts.js';
import fundamentalsRouter from './routes/fundamentals.js';
import candlesRouter from './routes/candles.js';
import hrhrRouter from './routes/hrhr.js';
import settingsRouter from './routes/settings.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.use('/api/portfolio', portfolioRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/news', newsRouter);
app.use('/api/advice', adviceRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/fundamentals', fundamentalsRouter);
app.use('/api/candles', candlesRouter);
app.use('/api/hrhr', hrhrRouter);
app.use('/api/settings', settingsRouter);

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Stock Monitor API running on http://localhost:${PORT}`);
  startAlertEngine();
  startHRHRScanner();
});
