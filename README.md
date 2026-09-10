# Career Copilot

AI-powered career platform — resume builder/analyzer, job search, application tracking, interview prep, career roadmaps, and an admin dashboard. Built with Next.js (App Router), TypeScript, Prisma/PostgreSQL, and Auth.js.

See `CLAUDE.md` for the full build log: what's implemented, the reasoning behind every scope decision, and known limitations.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in real values:
   - `DATABASE_URL` — a PostgreSQL connection string (this project uses a free [Neon](https://neon.tech) instance)
   - `AUTH_SECRET` — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `ANTHROPIC_API_KEY` — optional; every AI feature falls back to a clearly-labeled mock provider when this is empty, so the app is fully runnable without it
3. `npx prisma migrate deploy` (or `npm run db:migrate` for a fresh dev database)
4. `npm run db:seed` — creates demo accounts (`demo@careercopilot.dev` / `admin@careercopilot.dev`, password `Password123!`)
5. `npm run dev` — open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / run it |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (no database needed) |
| `npm run test:integration` | Integration tests — **writes to and deletes from `TEST_DATABASE_URL`**, never `DATABASE_URL` |
| `npm run test:e2e` | Playwright E2E — spins up its own dev server against `TEST_DATABASE_URL` on port 3100 |
| `npm run test:all` | Unit + integration |

## Testing against a real database, safely

Integration and E2E tests need a **separate** Postgres database (a Neon branch works well) set as `TEST_DATABASE_URL` in `.env`. Both test suites refuse to run if `TEST_DATABASE_URL` is unset or if it doesn't match the database the tests actually connect to — this is a deliberate guard against ever touching production data. Never point `TEST_DATABASE_URL` at the same database as `DATABASE_URL`.

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main`:
- **build** job (always runs, no secrets needed): install, `prisma generate`, lint, `next build` (which does Next.js's own type-checking and static-render analysis — a stricter check than a standalone `tsc`), unit tests.
- **integration** job (only runs once configured): add a `TEST_DATABASE_URL` repository secret (Settings → Secrets and variables → Actions) pointing at a disposable Postgres database, and this job runs the integration suite against it automatically.

E2E isn't wired into CI — it needs a running app instance and browser install and was judged not worth the added CI time/complexity yet; run it locally with `npm run test:e2e`.

## Deploying

This project has never been deployed — it's been built and tested entirely locally plus against a Neon dev/test branch. To actually deploy it (e.g. to [Vercel](https://vercel.com), the natural fit for Next.js):

1. Push this repo to GitHub.
2. Import it in Vercel (or your host of choice) and set the same environment variables from `.env.example` as project env vars — at minimum `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL` (your real deployed URL), and `ANTHROPIC_API_KEY` if you want real AI output instead of the mock.
3. Run `npx prisma migrate deploy` against the production database before or during the first deploy.

Known gaps before this is truly production-ready (see `CLAUDE.md`'s Status section for the full, current list): email sending is a `console.log` stub (no real provider wired in), file storage is local-disk only (won't survive a multi-instance deployment), there's no payment gateway, and rate limiting is in-memory/single-process.
