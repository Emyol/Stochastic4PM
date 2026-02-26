# Dev Setup

## Requirements
- Node.js 20+
- Docker Desktop (for PostgreSQL)

## Environment variables
Create `.env` based on `.env.example`.

## Local database (Docker Compose)
- Use Postgres 16 container.
- Connection string: `postgresql://postgres:postgres@localhost:5432/thesis_pm`

## Commands (expected)
1. `docker compose up -d`
2. `npm install`
3. `npx prisma migrate dev`
4. `npx prisma db seed`
5. `npm run dev`

## Seed data
Seed should create:
- Admin user:
  - email: pm@thesis.local
  - password: Password123!
  - name: Project Manager
- Member 1:
  - email: member1@thesis.local
  - password: Password123!
  - name: Member One
- Member 2:
  - email: member2@thesis.local
  - password: Password123!
  - name: Member Two
Also seed at least:
- 1 sprint (current date range)
- 6 sprint tasks across all statuses (some with subtasks)
- 4 general tasks

## File uploads
- Create `/uploads` folder at project root.
- In dev, store files there.
- Serve downloads via `/api/attachments/:id`.

