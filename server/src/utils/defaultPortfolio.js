import { randomUUID } from 'crypto';

export function ensureDefaultPortfolio(db, userId) {
  const existingDefault = db
    .prepare('SELECT * FROM portfolios WHERE user_id = ? AND is_default = 1 ORDER BY created_at ASC LIMIT 1')
    .get(userId);
  if (existingDefault) return existingDefault;

  const firstPortfolio = db
    .prepare('SELECT * FROM portfolios WHERE user_id = ? ORDER BY created_at ASC LIMIT 1')
    .get(userId);

  if (firstPortfolio) {
    db.prepare('UPDATE portfolios SET is_default = 0 WHERE user_id = ?').run(userId);
    db.prepare('UPDATE portfolios SET is_default = 1 WHERE id = ?').run(firstPortfolio.id);
    return { ...firstPortfolio, is_default: 1 };
  }

  const id = randomUUID();
  db.prepare('INSERT INTO portfolios (id, user_id, name, is_default) VALUES (?, ?, ?, 1)')
    .run(id, userId, 'Default');
  return db.prepare('SELECT * FROM portfolios WHERE id = ?').get(id);
}

export function backfillDefaultPortfolioItems(db, userId) {
  const portfolio = ensureDefaultPortfolio(db, userId);
  db.prepare('UPDATE holdings SET portfolio_id = ? WHERE user_id = ? AND portfolio_id IS NULL')
    .run(portfolio.id, userId);
  db.prepare('UPDATE alerts SET portfolio_id = ? WHERE user_id = ? AND portfolio_id IS NULL')
    .run(portfolio.id, userId);
  db.prepare('UPDATE trades SET portfolio_id = ? WHERE user_id = ? AND portfolio_id IS NULL')
    .run(portfolio.id, userId);
  return portfolio;
}
