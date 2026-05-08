import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import passport from 'passport';
import connectSqlite3 from 'connect-sqlite3';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

// Import passport config as a side effect (registers strategies + serialize/deserialize)
import './config/passport.js';

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
import authRouter from './routes/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3001;
const isProd = process.env.NODE_ENV === 'production';

const SQLiteStore = connectSqlite3(session);
const DATA_DIR = process.env.DATA_DIR || './data';

app.use(cors({
  origin: isProd ? false : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: DATA_DIR }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: isProd, maxAge: 30 * 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.use('/auth', authRouter);

app.use('/api/portfolio', portfolioRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/news', newsRouter);
app.use('/api/advice', adviceRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/fundamentals', fundamentalsRouter);
app.use('/api/candles', candlesRouter);
app.use('/api/hrhr', hrhrRouter);
app.use('/api/settings', settingsRouter);

// Serve built frontend in production
if (isProd) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Stock Monitor API running on http://localhost:${PORT}`);
  startAlertEngine();
  startHRHRScanner();
});
