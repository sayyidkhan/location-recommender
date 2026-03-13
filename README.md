# location-recommender

Post-event recommendation API. Takes event details + location, returns 3 suggestions with AI-generated images (WaveSpeed AI).

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set your WaveSpeed API key**
   ```bash
   cp .env.example .env
   # Edit .env and add: WAVESPEED_API_KEY=your_key
   ```
   Get your key at [wavespeed.ai/accesskey](https://wavespeed.ai/accesskey)

## Run locally

```bash
npm run dev
# or
node server.js
```

Then:

```bash
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"event": "Just left a jazz concert, feeling relaxed", "location": "Brooklyn, NY"}'
```

## Deploy to Vercel

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add `WAVESPEED_API_KEY` in Project Settings → Environment Variables
4. Deploy

Endpoint: `POST https://your-app.vercel.app/api/recommend`

## API

See [docs/API.md](docs/API.md) for full spec.
