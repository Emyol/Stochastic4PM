# Thesis Project Management Portal

A Jira-like project management app for thesis teams. Built with **Next.js 16**, **Tailwind CSS + shadcn/ui**, **Prisma**, **Supabase (PostgreSQL)**, and **Vercel Blob** for file storage.

## Tech Stack

| Layer        | Tech                               |
| ------------ | ---------------------------------- |
| Framework    | Next.js 16 (App Router)            |
| UI           | Tailwind CSS v4, shadcn/ui         |
| Auth         | NextAuth v4 (Credentials + JWT)    |
| Database     | Supabase PostgreSQL via Prisma ORM |
| File Storage | Vercel Blob                        |
| Deployment   | Vercel                             |

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Vercel](https://vercel.com) account (for Blob storage + deployment)

## Local Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

- **DATABASE_URL** — Supabase pooler connection string (port 6543, `?pgbouncer=true`)
- **DIRECT_URL** — Supabase session/direct connection string (port 5432)
- **NEXTAUTH_SECRET** — any random string
- **BLOB_READ_WRITE_TOKEN** — get this from Vercel dashboard after adding a Blob store

> You can find both database URLs in **Supabase Dashboard → Settings → Database → Connection string**.

### 3. Push schema & seed the database

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seeded Accounts

| Email                | Password     | Role   |
| -------------------- | ------------ | ------ |
| pm@thesis.local      | Password123! | ADMIN  |
| member1@thesis.local | Password123! | MEMBER |
| member2@thesis.local | Password123! | MEMBER |

## Deploying to Vercel

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. In **Vercel → Project Settings → Environment Variables**, add:
   - `DATABASE_URL` (Supabase pooler URL)
   - `DIRECT_URL` (Supabase direct URL)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel production URL, e.g. `https://your-app.vercel.app`)
4. Add a **Blob Store** in **Vercel → Storage** and link it to the project (auto-sets `BLOB_READ_WRITE_TOKEN`).
5. Deploy. Prisma Client is generated during the build via the `postinstall` script.
6. After first deploy, run the seed once:
   ```bash
   npx prisma db seed
   ```

## Playwright Smoke Tests

```bash
npx playwright install
npm run test:e2e
```
