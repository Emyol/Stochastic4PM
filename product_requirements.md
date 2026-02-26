# Product Requirements Document (PRD)

## Product name
Thesis PM Portal (Jira-like)

## Target users
- **Project Manager (PM / Admin)**: creates sprints, creates tasks, assigns members, monitors progress.
- **Member**: views assigned tasks, updates status, adds comments, uploads attachments.

## Core entities
- Users
- Sprints
- Tasks (can have subtasks)
- Attachments
- Comments
- Calendar events (derived from tasks/sprints)

## Status workflow
Use this fixed workflow (no custom statuses for v1):
- BACKLOG
- TODO
- IN_PROGRESS
- IN_REVIEW
- DONE
- BLOCKED

## Task types
- **SPRINT_TASK**: belongs to a Sprint (sprintId required). Appears on board, Gantt, calendar.
- **GENERAL_TASK**: not part of a sprint (sprintId null). Appears in “General Tasks” list and calendar.

## Must-have features (v1)
### Authentication & Accounts
1. Login/logout with email+password.
2. Roles:
   - ADMIN (PM)
   - MEMBER
3. Admin can create new users and reset passwords.

### Tasks (Jira-like)
1. Create a task with: title, description, status, priority, startDate, dueDate, assignee, taskType.
2. Create subtasks under a task (subtasks share the same fields; they are just tasks with parentId set).
3. Assign tasks and subtasks to a member.
4. Update status and dates.
5. Comments per task.
6. Basic search + filters:
   - by status
   - by assignee
   - by sprint
   - by taskType
7. Audit trail (minimal):
   - store status changes with timestamp + user

### Sprints
1. Create sprint with: name, startDate, endDate.
2. Assign sprint tasks to sprints.
3. Sprint overview page: list tasks by status + progress (% done).

### Views
1. **Board view**: sprint tasks grouped by status columns.
2. **Gantt view**: sprint tasks displayed on timeline using startDate/dueDate.
3. **General tasks view**: separate list for GENERAL_TASK.
4. **Calendar view**: month/week/day showing:
   - task start dates
   - task due dates
   - sprint start/end markers

### Attachments
1. Upload attachments for a task/subtask.
2. Store file metadata in DB and store file data on server local filesystem (`/uploads`).
3. Download attachment.
4. Enforce limits:
   - Max file size: 25 MB
   - Allowed extensions: pdf, docx, pptx, xlsx, png, jpg, jpeg, txt, md, zip

### UI/UX requirements
1. Responsive on mobile and desktop browsers.
2. Blue palette, modern clean UI.
3. Fast navigation: left sidebar on desktop, bottom nav on mobile.

## Nice-to-have (do NOT implement unless v1 is complete)
- Drag-and-drop between board columns
- Task dependencies in Gantt
- Notifications

## Out of scope (explicitly do not build)
- Real-time collaboration (websockets)
- External integrations (Google Calendar, Drive, Jira import/export)
- Mobile native apps

