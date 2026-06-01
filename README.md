# CashTrack 💸

A personal income & expense tracker — a lightweight accounting / cash-tracking web app.
Built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, **Recharts**, and **Supabase (Postgres)**.

## Features

- 🔐 **Email/password accounts** — sessions via signed, HTTP-only JWT cookies (bcrypt-hashed passwords)
- ➕ **Add / edit / delete** income and expense transactions
- 🏷️ **Categories** — colored, per-type (income vs expense), seeded with sensible defaults
- 📊 **Dashboard** — balance, monthly income/expense, spending-by-category donut, 6-month income-vs-expense bars
- 🔎 **Filtering** — by type, category, date range, and free-text search
- 📁 **CSV export** — download the current (filtered) transactions for Excel
- 💱 **Multi-currency display** (THB, USD, EUR, GBP, JPY, CNY, AUD, SGD)
- 📱 **Responsive** — works on desktop and mobile

## Tech & architecture

- **Next.js App Router** with Server Components + Server Actions (no separate API layer for mutations)
- **postgres.js** talks directly to Supabase's transaction-mode pooler (server-side only — no DB
  credentials or keys are ever shipped to the browser)
- **`proxy.ts`** (Next.js 16's renamed middleware) guards authenticated routes
- All data is scoped to the logged-in `user_id`

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

- `DATABASE_URL` — your Supabase **Transaction pooler** connection string
  (Dashboard → Project Settings → Database → Connection string → *Transaction pooler*, port `6543`).
- `AUTH_SECRET` — a random string. Generate one with:

  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  ```

### 3. Create the database tables

```bash
npm run db:init
```

This applies [`db/schema.sql`](db/schema.sql) to your database.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start tracking.

## Scripts

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the dev server                 |
| `npm run build`   | Production build                     |
| `npm run start`   | Run the production build             |
| `npm run lint`    | Lint                                 |
| `npm run db:init` | Apply the SQL schema to the database |

## Deploying

Deploys cleanly to **Vercel**. Add `DATABASE_URL` and `AUTH_SECRET` as environment variables in the
project settings, then deploy. The schema only needs to be applied once (`npm run db:init` locally,
or run `db/schema.sql` in the Supabase SQL editor).

## Security notes

- Never commit `.env.local` — it is gitignored.
- Every Server Action and the CSV route re-checks the session, so they're safe against direct POSTs.
