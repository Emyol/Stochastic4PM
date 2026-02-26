# API Spec (Next.js Route Handlers)

Use Next.js App Router route handlers under `app/api/...`.

## Auth
Handled by NextAuth.
- Session includes: userId, role, name, email.

## Response conventions
- Use JSON.
- On validation errors: 400 with `{ error: "..." }`.
- On auth errors: 401/403.

## Routes

### Users (ADMIN only)
- `GET /api/users` → list users
- `POST /api/users` → create user (name, email, password, role)
- `PATCH /api/users/:id` → update user (name, role) + optional password reset
- `DELETE /api/users/:id` → soft-delete NOT required; can hard delete for v1

### Sprints (ADMIN only for write)
- `GET /api/sprints` → list sprints (include task counts)
- `POST /api/sprints` → create sprint (name, startDate, endDate)
- `GET /api/sprints/:id` → sprint detail + tasks
- `PATCH /api/sprints/:id` → update sprint
- `DELETE /api/sprints/:id` → delete sprint (only if no tasks; otherwise block)

### Tasks
- `GET /api/tasks`
  - query params: `type`, `sprintId`, `assigneeId`, `status`, `q` (search by title)
  - returns tasks (include subtasks count)
- `POST /api/tasks`
  - body: title, description, type, priority, startDate, dueDate, sprintId?, assigneeId?, parentId?
  - enforce invariants from `data_model_prisma.md`
- `GET /api/tasks/:id` → task detail including subtasks, comments, attachments
- `PATCH /api/tasks/:id`
  - can update: title, description, status, priority, startDate, dueDate, sprintId (ADMIN only), assigneeId, etc.
  - if status changes, insert StatusEvent
- `DELETE /api/tasks/:id`
  - delete task and its subtasks (cascade via code; Prisma relation won’t auto-delete by default)

### Comments
- `POST /api/tasks/:id/comments` → add comment (body)
- `DELETE /api/comments/:id` → ADMIN or comment author

### Attachments
Store files in `/uploads` at repo root (create folder).
- `POST /api/tasks/:id/attachments`
  - multipart form upload (file)
  - validate file size and allowed extensions
  - generate `storedName` as `{cuid}-{sanitizedOriginalName}`
  - save to disk and create Attachment row
- `GET /api/attachments/:id` → download (set Content-Disposition, stream file)
- `DELETE /api/attachments/:id`
  - ADMIN or uploader; delete file from disk and remove DB row

## Derived Calendar Events
Calendar reads tasks/sprints and transforms to events in the UI.
No separate DB table for events in v1.

