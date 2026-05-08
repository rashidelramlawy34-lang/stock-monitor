import { Router } from 'express';
import { fetchCandles } from '../services/candleService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const [spy, qqq] = await Promise.all([fetchCandles('SPY'), fetchCandles('QQQ')]);
    res.json({ SPY: spy, QQQ: qqq });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
