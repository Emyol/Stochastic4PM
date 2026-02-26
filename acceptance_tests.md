# Acceptance Tests (Definition of Done)

## Functional acceptance criteria
### Auth
1. User can log in with seeded credentials.
2. Unauthenticated users cannot access protected pages (redirect to /login).
3. Role-based access:
   - MEMBER cannot open /users or /sprints (shows 403 page or redirect).
   - ADMIN can access /users and /sprints.

### Tasks + Subtasks
1. ADMIN can create a sprint task (SPRINT_TASK) assigned to a member with startDate and dueDate.
2. Member can update status of an assigned task.
3. Subtask creation:
   - When a subtask is created under a sprint task, it automatically links to the same sprint and type.
4. Status log:
   - When status changes, StatusEvent row is created.
5. Search/filter:
   - Searching by title returns matching tasks.

### Board
1. Board shows columns with correct tasks.
2. Changing status (via dropdown) moves task to another column after refresh.

### Gantt
1. Gantt shows tasks in selected sprint.
2. Tasks without start/due display but are visually marked as incomplete scheduling data.

### General Tasks
1. General task list only shows GENERAL_TASK.
2. General tasks can be created and assigned.

### Calendar
1. Calendar displays task due dates and sprint start/end.
2. Clicking a task event opens task details.

### Attachments
1. Upload attachment (PDF) to a task.
2. Attachment appears in task detail list.
3. Download returns the correct file.

## Playwright smoke tests (minimum)
Create Playwright tests that:
1. Log in as admin and confirm /dashboard loads.
2. Create a general task and confirm it appears in list.
3. Upload an attachment to an existing task and confirm it appears.
4. Log in as member and confirm /users is blocked.

