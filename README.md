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

Roommate recommendations use compatibility algorithm `1.0.0`. City, overlapping budget, and a verified gender-requirement mismatch are hard gates — a stated roommate gender requirement only blocks when both people have supplied a gender and the two conflict; when a profile gender is missing the requirement is surfaced as a note rather than a blocker, because absence of data is not incompatibility. Eligible candidates receive a weighted score with a per-criterion breakdown and completeness count. Every other person with a preference profile is still listed so nobody is hidden — people who fail a hard gate or have too little data to score are ranked below real matches and clearly badged "Not a match", with the specific incompatibility reasons shown. Different areas in the same city currently receive a provisional location score because area-to-area distance is not geocoded. The score describes recorded preference alignment, not predicted roommate success. Group feasibility and property suitability are separate future scores.

The default weights are budget 25, location 20, move-in date 15, room sharing 10, smoking 8, cleanliness 7, drinking 5, food 5, and sleep schedule 5. To override them on the backend, set `MATCHING_WEIGHTS_JSON` to an object with those keys and non-negative numeric weights.

For Google Places suggestions, enable the Google Maps JavaScript API and Places API (New), configure billing, and set `VITE_GOOGLE_MAPS_API_KEY` in the frontend environment. Restrict that browser key by HTTP referrer and API. Selecting a result fills City and Area; both fields remain editable if suggestions are unavailable.

## Product focus

Phase 1 focuses on:

- matching people by destination, budget, move-in date, room preferences, and lifestyle
- connection requests and acceptance flow
- group creation and requests
- blocking and reporting foundations
- notifications and admin basics

This is intentionally not a property marketplace.
