# location-recommender

Post-event recommendation API. Takes event details + location, returns 3 suggestions with AI-generated images (WaveSpeed AI).

## Features

- **POST /api/recommend** – Single endpoint, minimal payload
- **WaveSpeed AI** – LLM for recommendations + text-to-image for visuals
- **Test UI** – HTML page to try the API in the browser
- **API key protection** – Optional `RECOMMEND_API_KEY` to secure the endpoint

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   | Variable | Required | Description |
   |----------|----------|-------------|
   | `WAVESPEED_API_KEY` | Yes | Get at [wavespeed.ai/accesskey](https://wavespeed.ai/accesskey) |
   | `RECOMMEND_API_KEY` | No | Protects the API; clients must send it via `Authorization: Bearer <key>` |

## Run locally

```bash
npm run dev
# or
node server.js
```

- **Test UI:** http://localhost:3000
- **API:** http://localhost:3000/api/recommend

### Example request

```bash
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"event": "Just left a jazz concert, feeling relaxed", "location": "Brooklyn, NY"}'
```

## Deploy to Vercel

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add environment variables in Project Settings → Environment Variables:
   - `WAVESPEED_API_KEY` (required)
   - `RECOMMEND_API_KEY` (optional)
4. Deploy

- **Test UI:** `https://your-app.vercel.app`
- **API:** `POST https://your-app.vercel.app/api/recommend`

## Project structure

```
├── api/
│   └── _recommend.js   # Recommend handler (underscore = not a Vercel function)
├── index.js            # Express app (Vercel entry point)
├── index.html          # Test UI
├── server.js           # Local dev server
├── docs/
│   ├── API.md          # API spec
│   └── PRD-*.md        # Product requirements
├── vercel.json
└── package.json
```

## API

See [docs/API.md](docs/API.md) for full spec.
