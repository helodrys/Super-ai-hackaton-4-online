# SafeFlow Thailand

SafeFlow Thailand is a React/Vite travel assistant prototype for Bangkok. It includes:

- Dashboard city comfort view
- Taxi fare, distance, and time prediction
- Mood-based trip planner
- MapLibre route display
- Optional Typhoon-powered itinerary generation with deterministic local fallback

## Local Development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production Build

```bash
npm run build
npm start
```

`npm run build` creates:

- `dist/` for the frontend
- `server-dist/` for the Node production server

`npm start` serves the frontend and the required API routes from one Node process.

## Required Deployment Settings

Use a Node-capable host such as Render, Railway, Fly.io, or a VPS.

Recommended settings:

```txt
Build command: npm ci && npm run build
Start command: npm start
```

Environment variables:

```txt
SAFEFLOW_ENABLE_TYPHOON=true
typhoon_api=your_typhoon_key
GOOGLE_MAPS_SERVER_KEY=optional_google_key
SAFEFLOW_ENABLE_LIVE_GOOGLE=false
SAFEFLOW_ENABLE_LIVE_OPEN_METEO=false
SAFEFLOW_DISABLE_OSRM=false
```

Do not commit `.env`. Add secrets only in your deployment provider dashboard.

## API Routes

The production server supports:

- `POST /api/plan-trip`
- `POST /api/routes/compute`
- `POST /api/routes/matrix`
- `POST /api/places/search`
- `POST /api/places/details`
- `GET /api/environment`

GitHub Pages alone is not enough for full functionality because the app needs these backend routes.
