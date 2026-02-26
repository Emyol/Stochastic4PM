# Data Model (Prisma) — source of truth

Use a single `Task` table for both tasks and subtasks (subtask = Task with `parentId`).

## Enums
- Role: ADMIN | MEMBER
- TaskStatus: BACKLOG | TODO | IN_PROGRESS | IN_REVIEW | DONE | BLOCKED
- TaskType: SPRINT_TASK | GENERAL_TASK
- Priority: LOW | MEDIUM | HIGH | URGENT

## Prisma schema (copy-paste ready)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  MEMBER
}

enum TaskStatus {
  BACKLOG
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
  BLOCKED
}

enum TaskType {
  SPRINT_TASK
  GENERAL_TASK
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  passwordHash  String
  role          Role     @default(MEMBER)

  assignedTasks Task[]   @relation("assignee")
  reportedTasks Task[]   @relation("reporter")
  comments      Comment[]
  statusEvents  StatusEvent[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Sprint {
  id        String   @id @default(cuid())
  name      String
  startDate DateTime
  endDate   DateTime

  tasks     Task[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Task {
  id          String     @id @default(cuid())
  title       String
  description String     @default("")
  status      TaskStatus @default(BACKLOG)
  type        TaskType
  priority    Priority   @default(MEDIUM)

  startDate   DateTime?
  dueDate     DateTime?

  // sprint linkage (required if type = SPRINT_TASK)
  sprintId    String?
  sprint      Sprint?    @relation(fields: [sprintId], references: [id])

  // assignee / reporter
  assigneeId  String?
  assignee    User?      @relation("assignee", fields: [assigneeId], references: [id])

  reporterId  String
  reporter    User       @relation("reporter", fields: [reporterId], references: [id])

  // subtasks (self-relation)
  parentId    String?
  parent      Task?      @relation("subtasks", fields: [parentId], references: [id])
  subtasks    Task[]     @relation("subtasks")

  comments    Comment[]
  attachments Attachment[]
  statusLog   StatusEvent[]

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([status])
  @@index([assigneeId])
  @@index([sprintId])
  @@index([type])
  @@index([parentId])
}

model Comment {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id])
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  body      String
  createdAt DateTime @default(now())

  @@index([taskId])
}

model Attachment {
  id           String   @id @default(cuid())
  taskId       String
  task         Task     @relation(fields: [taskId], references: [id])

  originalName String
  storedName   String   // filename on disk
  mimeType     String
  sizeBytes    Int
  uploadedById String
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])
  createdAt    DateTime @default(now())

  @@index([taskId])
}

model StatusEvent {
  id        String     @id @default(cuid())
  taskId    String
  task      Task       @relation(fields: [taskId], references: [id])
  actorId   String
  actor     User       @relation(fields: [actorId], references: [id])

  from      TaskStatus
  to        TaskStatus
  at        DateTime   @default(now())

  @@index([taskId])
}
```

## Invariants (must enforce in code)
1. If `Task.type == SPRINT_TASK`, then `sprintId` must not be null.
2. Subtasks inherit sprint association from their parent:
   - If `parentId` is not null, set `type` to match parent, and set `sprintId` to match parent (for SPRINT_TASK).
3. Only ADMIN can create/update users and sprints.
4. Members can only edit tasks where:
   - they are the assignee OR they are the reporter OR they are ADMIN.

