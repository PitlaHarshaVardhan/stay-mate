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

1. Copy `.env.example` to `.env` inside `backend/`
2. Create a PostgreSQL database
3. Run migrations

```bash
cd backend
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

## Production origins

- Set `VITE_API_URL` in the frontend hosting environment to the deployed API origin, for example `https://api.yourdomain.com`.
- Set `CLIENT_URL` in the backend hosting environment to the exact deployed frontend origin, for example `https://app.yourdomain.com`.
- Use HTTPS and keep the frontend and API on subdomains of the same domain so authentication cookies work reliably.

## Product focus

Phase 1 focuses on:

- matching people by destination, budget, move-in date, room preferences, and lifestyle
- connection requests and acceptance flow
- group creation and requests
- blocking and reporting foundations
- notifications and admin basics

This is intentionally not a property marketplace.
