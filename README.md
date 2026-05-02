# ThaiTAI

ThaiTAI is a React/Vite travel assistant prototype for Bangkok. It includes:

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

## Build And Run

```bash
npm run build
npm start
```

`npm run build` creates:

- `dist/` for the frontend
- `server-dist/` for the Node production server

`npm start` serves the frontend and the required API routes from one Node process.

## Deployment

Use these settings on Render, Railway, Fly.io, or any Node host:

```txt
Build command: npm ci && npm run build
Start command: npm start
```

Environment variables:

```txt
THAITAI_ENABLE_TYPHOON=true
typhoon_api=your_typhoon_key
GOOGLE_MAPS_SERVER_KEY=optional_google_key
THAITAI_ENABLE_LIVE_GOOGLE=false
THAITAI_ENABLE_LIVE_OPEN_METEO=false
THAITAI_DISABLE_OSRM=false
```

## API Routes

The server supports:

## API Routes

- `POST /api/plan-trip` — Generates a personalized itinerary.
- `POST /api/routes/compute` — Computes route distance, duration, and map path.
- `POST /api/routes/matrix` — Calculates travel times between multiple places.
- `POST /api/places/search` — Searches for attractions or destinations.
- `POST /api/places/details` — Gets detailed information for a selected place.
- `GET /api/environment` — Returns enabled feature flags for the frontend.

website: https://thaitai.onrender.com/


