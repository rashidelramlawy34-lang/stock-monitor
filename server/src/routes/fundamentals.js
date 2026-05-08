import { Router } from 'express';
import { fetchFundamentals } from '../services/fundamentalsService.js';

const router = Router();

router.get('/:ticker', async (req, res) => {
  try {
    const data = await fetchFundamentals(req.params.ticker);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
