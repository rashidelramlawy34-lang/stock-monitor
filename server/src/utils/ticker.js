export const MAX_TICKER_LENGTH = 32;

export function normalizeTicker(value) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .slice(0, MAX_TICKER_LENGTH);
}
