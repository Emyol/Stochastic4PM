# UI/UX Spec

## Design goals
- Looks like a light Jira-style portal.
- Fast to scan: statuses are columns, cards are compact.
- Works great on phone and desktop.

## Color palette (blue shades)
Use these exact hex colors (Tailwind custom theme recommended):
{
  "primary_900": "#0A2342",
  "primary_800": "#0B2E59",
  "primary_700": "#0D3B73",
  "primary_600": "#0F4C8A",
  "primary_500": "#1366A6",
  "primary_400": "#1E7FC6",
  "primary_300": "#4DA0E0",
  "primary_200": "#8CC1F0",
  "primary_100": "#CFE8FF",
  "neutral_900": "#0B1220",
  "neutral_700": "#334155",
  "neutral_500": "#64748B",
  "neutral_300": "#CBD5E1",
  "neutral_100": "#F1F5F9"
}

## Layout
### Desktop
- Left sidebar (icons + labels):
  - Dashboard
  - Board
  - Gantt
  - Calendar
  - General Tasks
  - Users (ADMIN only)
  - Sprints (ADMIN only)
  - Settings / Account
- Main content area with top bar:
  - Search (task title)
  - Filters (status, assignee, sprint)
  - “Create task” button

### Mobile
- Bottom nav with 4 items:
  - Board
  - Calendar
  - General
  - Account
- Board uses horizontal scroll for columns.

## Pages

### 1) `/login`
- Email + password
- Submit
- Error states

### 2) `/dashboard`
- Quick stats:
  - Active sprint (if any)
  - Tasks due in next 7 days
  - “My tasks” list

### 3) `/board`
- Sprint selector dropdown (default: current active sprint by date)
- Columns: BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED
- Cards show: title, priority badge, assignee avatar initials, due date
- Clicking card opens Task Drawer/Modal with details:
  - Description
  - Subtasks list (with checkbox-style completion -> maps to DONE status)
  - Comments
  - Attachments

### 4) `/gantt`
- Sprint selector
- Read-only Gantt timeline for sprint tasks + subtasks
- Bars reflect startDate → dueDate
- If task missing startDate or dueDate, show as 1-day bar at dueDate or startDate, with a warning icon

### 5) `/general`
- Table/list view of GENERAL_TASK
- Filters: status, assignee, due date range
- Create general task button

### 6) `/calendar`
- FullCalendar month/week/day
- Events:
  - Task start (label: “Start: <task>”)
  - Task due (label: “Due: <task>”)
  - Sprint start/end (label: “Sprint Start/End: <sprint>”)
- Clicking a task event opens Task modal.

### 7) `/sprints` (ADMIN only)
- List sprints
- Create sprint
- Edit sprint
- Delete sprint (only if no tasks)

### 8) `/users` (ADMIN only)
- List users
- Create user (name, email, role, temp password)
- Reset password

### 9) `/account`
- View current user profile
- Change password

## Accessibility & UX rules
- Every form must have inline validation messages.
- Buttons show loading state.
- Use toasts for success/error.
- Keep tap targets large on mobile.
- Avoid cramped tables on mobile: switch to cards.

