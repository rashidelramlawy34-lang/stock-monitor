import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  fetchShortInterest,
  fetchInsiders,
  fetchInstitutional,
  fetchDividends,
  fetchUpgradesDowngrades,
  fetchEconomicCalendar,
} from '../services/marketDataService.js';

const router = Router();
router.use(requireAuth);

router.get('/short-interest/:ticker', async (req, res) => {
  try {
    res.json(await fetchShortInterest(req.params.ticker));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/insiders/:ticker', async (req, res) => {
  try {
    res.json(await fetchInsiders(req.params.ticker));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/institutional/:ticker', async (req, res) => {
  try {
    res.json(await fetchInstitutional(req.params.ticker));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/dividends/:ticker', async (req, res) => {
  try {
    res.json(await fetchDividends(req.params.ticker));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/upgrades/:ticker', async (req, res) => {
  try {
    res.json(await fetchUpgradesDowngrades(req.params.ticker));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/economic-calendar', async (req, res) => {
  try {
    res.json(await fetchEconomicCalendar());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
