# StayMate

StayMate is a roommate and group matching platform for people moving to a new city.

## Architecture

- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma
- Auth: JWT in HTTP-only cookies

## Quick start

```bash
npm install
npm run dev
```

## Backend setup

1. Copy `backend/.env.example` to `backend/.env.local` for local development
2. Create a PostgreSQL database
3. Run migrations

```bash
cd backend
npm install
npm run prisma:migrate
npm run seed
npm run dev
```

`npm run prisma:migrate` and `npm run prisma:status` explicitly use the local database URL in `backend/.env.local`.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

For local development, set `VITE_API_URL=http://localhost:4000` in `frontend/.env.local`.
The backend loads `backend/.env.local` outside production, overriding any base `.env` values.

## Production origins

- Set `VITE_API_URL` in the frontend hosting environment to the deployed API origin, for example `https://api.yourdomain.com`.
- Set `CLIENT_URL` in the backend hosting environment to the exact deployed frontend origin, for example `https://app.yourdomain.com`.
- Set the backend `DATABASE_URL` to the production Neon connection string and `NODE_ENV=production` in the backend hosting environment.
- Configure `SMTP_HOST`, `SMTP_PORT`, and `SMTP_FROM` on the backend to deliver password reset emails. Set `SMTP_USER` and `SMTP_PASS` too when your SMTP provider requires authentication.
- Configure Render's pre-deploy command as `npm run prisma:migrate:deploy --workspace backend` to apply committed migrations using Render's production `DATABASE_URL`.
- Use HTTPS and keep the frontend and API on subdomains of the same domain so authentication cookies work reliably.
- Do not copy either local `.env.local` file to production; Render and Vercel environment settings are used there.

## Matching and location search

Roommate recommendations use compatibility algorithm `1.1.0`. Overlapping budget and a verified gender-requirement mismatch are hard gates — a stated roommate gender requirement only blocks when both people have supplied a gender and the two conflict; when a profile gender is missing the requirement is surfaced as a note rather than a blocker, because absence of data is not incompatibility. Location is never a hard gate: a candidate in another city is kept, ranked lower, and shown with the real straight-line (haversine) distance between the two saved map pins plus a distance-based location percentage (100% within 2 km down to 10% beyond 100 km), so nobody is badged "Not a match" just for living far away. When only one or neither side has a map pin saved, location falls back to a provisional city/area comparison. Eligible candidates receive a weighted score with a per-criterion breakdown and completeness count. Every other person with a preference profile is still listed so nobody is hidden — people who fail a hard gate or have too little data to score are ranked below real matches and shown with their overlap percentage (or badged "Not a match" when nothing is comparable), with the specific incompatibility reasons shown in the match details. The score describes recorded preference alignment, not predicted roommate success. Group feasibility and property suitability are separate future scores.

The default weights are budget 25, location 20, move-in date 15, room sharing 10, smoking 8, cleanliness 7, drinking 5, food 5, and sleep schedule 5. To override them on the backend, set `MATCHING_WEIGHTS_JSON` to an object with those keys and non-negative numeric weights.

For place suggestions, create an API key at [cloud.maptiler.com](https://cloud.maptiler.com/account/keys/) and set `VITE_MAPTILER_API_KEY` in the frontend environment (locally in `frontend/.env.local`, in production in Vercel's environment settings). Restrict the key by HTTP referrer to your domains. Selecting a result fills City and Area; both fields are read-only and can only be set by picking a search suggestion. The pick also stores the place's map pin (latitude/longitude) with the preference, which is what the matching algorithm uses to show distance between two people and score location accordingly.

## Product focus

Phase 1 focuses on:

- matching people by destination, budget, move-in date, room preferences, and lifestyle
- connection requests and acceptance flow
- group creation and requests
- blocking and reporting foundations
- notifications and admin basics

This is intentionally not a property marketplace.
