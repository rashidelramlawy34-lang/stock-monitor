import { Router } from 'express';
import { getCachedHRHR, runHRHRScan } from '../services/hrhrService.js';

const router = Router();

router.get('/', (req, res) => {
  const { results, generated_at } = getCachedHRHR();
  res.json({ results, generated_at });
});

router.post('/refresh', (req, res) => {
  res.status(202).json({ message: 'HRHR scan started' });
  runHRHRScan().catch(err => console.error('[HRHR] Refresh error:', err.message));
});

export default router;
