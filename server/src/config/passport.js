import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getDb } from '../db/schema.js';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const db = getDb();
    const user = {
      id: profile.id,
      email: profile.emails?.[0]?.value || null,
      name: profile.displayName || null,
      avatar: profile.photos?.[0]?.value || null,
    };
    db.prepare(
      `INSERT OR REPLACE INTO users (id, email, name, avatar) VALUES (@id, @email, @name, @avatar)`
    ).run(user);
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) => {
  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
  done(null, user || null);
});

export default passport;
