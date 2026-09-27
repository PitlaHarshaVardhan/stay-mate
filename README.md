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
- Configure Render's pre-deploy command as `npm run prisma:migrate:deploy --workspace backend` to apply committed migrations using Render's production `DATABASE_URL`.
- Use HTTPS and keep the frontend and API on subdomains of the same domain so authentication cookies work reliably.
- Do not copy either local `.env.local` file to production; Render and Vercel environment settings are used there.

## Product focus

Phase 1 focuses on:

- matching people by destination, budget, move-in date, room preferences, and lifestyle
- connection requests and acceptance flow
- group creation and requests
- blocking and reporting foundations
- notifications and admin basics

This is intentionally not a property marketplace.
