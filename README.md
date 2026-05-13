# Stock Monitor

A full-stack stock monitoring app with live prices, AI-driven buy/hold/sell advice, news feed, and portfolio management.

## Quick Start

```bash
# 1. Clone / enter the project
cd stock-monitor

# 2. Copy and fill in env vars
cp .env.example .env
# Edit .env — at minimum set OPENAI_API_KEY

# 3. Install dependencies
cd server && npm install
cd ../client && npm install

# 4. Run both servers (two terminals)
cd server && npm run dev      # API on http://localhost:3001
cd client && npm run dev      # UI  on http://localhost:5173
```

## Project Structure

```
stock-monitor/
├── server/                  # Express API
│   ├── src/
│   │   ├── index.js         # Server entry point
│   │   ├── routes/          # REST endpoint handlers
│   │   │   ├── portfolio.js
│   │   │   ├── prices.js
│   │   │   ├── news.js
│   │   │   └── advice.js
│   │   ├── services/        # Business logic
│   │   │   ├── priceService.js   # yahoo-finance2 wrapper
│   │   │   ├── newsService.js    # News fetching & caching
│   │   │   └── aiService.js      # OpenAI API calls
│   │   └── db/
│   │       └── schema.js    # SQLite schema + migrations
│   └── tests/
├── client/                  # React + Tailwind UI
│   └── src/
│       ├── components/
│       ├── hooks/
│       └── pages/
├── prompts/                 # AI prompt templates
├── db/                      # SQLite database files (git-ignored)
└── .env.example
```

## MCP Server Setup (for Claude Code sessions)

Add these to your Claude Code MCP config (`~/.claude/settings.json → mcpServers`):

### Essential

**Brave Search** — real-time financial news
```json
"brave-search": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-brave-search"],
  "env": { "BRAVE_API_KEY": "your_key" }
}
```
Get a free key at https://brave.com/search/api/

**SQLite** — query the portfolio database directly
```json
"sqlite": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sqlite", "--db-path", "./db/portfolio.db"]
}
```

**Filesystem** — read/write portfolio configs
```json
"filesystem": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/YOU/Desktop/untitled folder 2/stock-monitor"]
}
```

**Fetch** — scrape SEC filings and IR pages
```json
"fetch": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-fetch"]
}
```

### Recommended

**Memory** — persist AI advice history across sessions
```json
"memory": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-memory"]
}
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Tailwind CSS, Recharts |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| Price Data | yahoo-finance2 (unofficial Yahoo Finance) |
| AI Layer | OpenAI API (GPT-5.5 by default) |
| Real-time | Server-Sent Events (price polling) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/portfolio` | List all holdings |
| POST | `/api/portfolio` | Add a holding |
| DELETE | `/api/portfolio/:ticker` | Remove a holding |
| GET | `/api/prices` | Fetch live prices for all holdings |
| GET | `/api/prices/:ticker` | Fetch price for one ticker |
| GET | `/api/news/:ticker` | Get news for a ticker |
| GET | `/api/advice/:ticker` | Get AI buy/hold/sell advice |
| GET | `/api/advice/discover` | Get new stock recommendations |
| GET | `/api/alerts` | List alerts |
| POST | `/api/alerts` | Create a price alert |
| DELETE | `/api/alerts/:id` | Delete an alert |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | For AI Advisor, Coach, Digest, and Discover features |
| `OPENAI_MODEL` | No | AI model override (default: `gpt-5.5`) |
| `OPENAI_DEEP_MODEL` | No | Deep analysis model override (default: `gpt-5.5`) |
| `PORT` | No | API server port (default: 3001) |
| `DB_PATH` | No | Path to SQLite file |
| `PRICE_REFRESH_INTERVAL` | No | Poll interval in ms (default: 30000) |
