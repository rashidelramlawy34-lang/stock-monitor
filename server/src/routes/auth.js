import { Router } from 'express';
import passport from 'passport';

const router = Router();

// Redirect to Google for authentication
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/?auth=failed' }),
  (req, res) => {
    res.redirect('/');
  }
);

// Return current authenticated user or null
router.get('/me', (req, res) => {
  res.json({ user: req.user || null });
});

// Destroy session and log out
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ ok: true });
  });
});

export default router;
