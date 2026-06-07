# 🎓 AdmissionHub

Your complete journey to top universities — a full-stack **Next.js 15 + TypeScript** platform where
students discover universities, follow a step-by-step admission roadmap, and get expert consultancy,
all in one place.

> Browse everything freely. You only need an account to **track your roadmap** or **connect with an
> approved consultant**.

## ✨ Features

- **Smart university finder** — filter by country, field of interest and budget; see fees, rankings,
  requirements, deadlines and a step-by-step application process for each university.
- **Step-by-step journey** — an 8-step admission roadmap with per-step progress tracking saved to your
  account.
- **Verified consultants** — approved consultants who signed up and were vetted on the platform.
- **Consultants near you** — more experts discovered live from Google (Places API), filtered to your
  city / country / field. Falls back to realistic demo data when no API key is set.
- **Consultant portal** — anyone can sign up as a consultant; profiles go live once an admin approves them.
- **Admin portal** — approve / revoke consultants and auto-fetch the latest universities from a public API.
- **Auto-fetched university data** — pulls real universities from the public
  [Hipolabs API](http://universities.hipolabs.com) and enriches them with country-based estimates.
- **Light & dark theme** — system-aware, toggleable, with a custom logo and branded design system.

## 🧱 Tech stack

| Area        | Choice                                               |
| ----------- | ---------------------------------------------------- |
| Framework   | Next.js 15 (App Router) + React 19 + TypeScript      |
| Styling     | Tailwind CSS (CSS-variable theming, class dark mode) |
| Database    | PostgreSQL via Prisma ORM (Neon / Vercel Postgres / Supabase) |
| Auth        | Custom JWT sessions (`jose`) in httpOnly cookies + `bcryptjs` |
| Icons       | lucide-react · Theme: next-themes                    |

## 🚀 Getting started

This app uses **PostgreSQL**. Grab a free database from [Neon](https://neon.tech),
Vercel Postgres, or Supabase and put its connection string in `.env` as `DATABASE_URL`.
(You can use the same cloud database for local development and production.)

```bash
npm install          # installs deps & generates the Prisma client
# set DATABASE_URL in .env first
npm run db:reset     # creates the tables and seeds demo data
npm run dev          # http://localhost:3000
```

> `npm install` runs `prisma generate` automatically. If you skip `db:reset`, run
> `npm run db:push && npm run db:seed` once.

### Demo accounts

| Role    | Email              | Password      |
| ------- | ------------------ | ------------- |
| Student | `student@demo.com` | `password123` |
| Admin   | `admin@demo.com`   | `admin123`    |

Or create your own student account at `/signup`, or a consultant account at `/become-consultant`.

## 🔑 Environment

Configured in `.env` (already created for local dev):

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
AUTH_SECRET="change-me-to-a-long-random-string"
GOOGLE_PLACES_API_KEY=""   # optional — enables live "consultants near you"
```

Without a Google key, the "consultants near you" feature returns realistic demo data so it still works.

## ☁️ Deploy to Vercel

1. Create a Postgres database (Vercel Postgres, [Neon](https://neon.tech), or Supabase) and copy its connection string.
2. In your Vercel project → **Settings → Environment Variables**, add:
   - `DATABASE_URL` — your Postgres connection string
   - `AUTH_SECRET` — a long random string
   - `GOOGLE_PLACES_API_KEY` — optional
3. Deploy. The `build` script runs `prisma db push` automatically, so the tables are
   created on first deploy.
4. **Seed once** (creates demo users + initial data). From your machine, point at the
   production database and run:
   ```bash
   DATABASE_URL="<your-prod-url>" npm run db:seed
   ```
   (Or just sign up via the UI and use the admin account to "Fetch latest universities".)

> ⚠️ SQLite does **not** work on Vercel — the filesystem is read-only and ephemeral.
> That's why this app uses PostgreSQL.

## 📜 Useful scripts

| Script             | Description                                  |
| ------------------ | -------------------------------------------- |
| `npm run dev`      | Start the dev server                         |
| `npm run build`    | Production build (runs `prisma generate`)    |
| `npm run start`    | Start the production server                  |
| `npm run db:push`  | Apply the schema to the database             |
| `npm run db:seed`  | Seed universities, consultants & demo users  |
| `npm run db:reset` | Reset the DB and reseed from scratch         |

## 🗺️ Key routes

| Route                | Access     | What it does                                   |
| -------------------- | ---------- | ---------------------------------------------- |
| `/`                  | public     | Landing page                                   |
| `/universities`      | public     | Finder with filters                            |
| `/universities/[id]` | public     | University detail (fees, steps, requirements)  |
| `/consultants`       | public     | Verified + Google-sourced consultants          |
| `/how-it-works`      | public     | Full 8-step journey                            |
| `/become-consultant` | public     | Consultant signup / application portal         |
| `/dashboard`         | student    | Roadmap progress, profile, saved universities  |
| `/admin`             | admin only | Approve consultants, fetch universities        |

## 🏗️ Project structure

```
prisma/                 schema.prisma + seed.ts
src/
  app/                  App Router pages + /api route handlers
  components/           UI kit, navbar, cards, forms, theme
  lib/                  prisma, auth, journey steps, utils, sync, constants
```
