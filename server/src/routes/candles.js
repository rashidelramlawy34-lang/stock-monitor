import { Router } from 'express';
import { fetchCandles } from '../services/candleService.js';

const router = Router();

router.get('/:ticker', async (req, res) => {
  try {
    const data = await fetchCandles(req.params.ticker);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
