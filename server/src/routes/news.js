import { Router } from 'express';
import { fetchNews } from '../services/newsService.js';

const router = Router();

router.get('/:ticker', async (req, res) => {
  try {
    const articles = await fetchNews(req.params.ticker);
    res.json(articles);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
