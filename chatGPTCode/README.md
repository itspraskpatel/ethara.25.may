# Tasko

Tasko is a small project management and task-tracking web app with built-in task and project summarization. It focuses on simple project workflows, team assignment, and quick overviews for project work.

This repository contains the Next.js App Router frontend, API routes, and Prisma database logic used by the app.

## Key features
- Create and manage projects and tasks
- Assign tasks to team members
- Kanban-style task board
- Per-task and per-project summarization endpoint (POST `/api/ai`)

## Tech stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- NextAuth for authentication
- Prisma + PostgreSQL (or any supported database)

## Prerequisites
- Node 18+ and npm
- A database (Postgres recommended)
- Environment variables configured (see below)

## Environment variables
Create a `.env` file in the project root with the following (example names):

- `DATABASE_URL` — Prisma database connection string
- `NEXTAUTH_URL` — App URL (e.g., `http://localhost:3000`)
- `NEXTAUTH_SECRET` — Secret used by NextAuth
- Optional OAuth client IDs/secrets if using providers (e.g. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)

## Setup (local)
1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npx prisma generate
```

3. Run database migrations (if you have migrations):

```bash
npx prisma migrate deploy
```

4. Start development server:

```bash
npm run dev
```

The app should be available at `http://localhost:3000`.

## Scripts
- `npm run dev` — Start Next.js in development mode
- `npm run build` — Build the app for production
- `npm run start` — Start the built app

## Important files
- API routes: `src/app/api` — server endpoints, including `src/app/api/ai/route.ts` for summarization
- Pages: `src/app/dashboard` — dashboard, projects, tasks
- Components: `src/components` — UI primitives and shared components
- Prisma client: `src/db/client/prismaClient.ts`

## Deployment
- Deployed on Railway
