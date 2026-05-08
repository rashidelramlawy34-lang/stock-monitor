import { Router } from 'express';
import { fetchPrice, fetchAllPrices } from '../services/priceService.js';
import { getDb } from '../db/schema.js';

const router = Router();

router.get('/market', async (req, res) => {
  try {
    const indices = await fetchAllPrices(['SPY', 'QQQ', 'DIA']);
    res.json(indices);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const holdings = getDb().prepare('SELECT ticker FROM holdings').all();
  if (holdings.length === 0) return res.json([]);

  const prices = await fetchAllPrices(holdings.map(h => h.ticker));
  res.json(prices);
});

router.get('/:ticker', async (req, res) => {
  try {
    const data = await fetchPrice(req.params.ticker);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
