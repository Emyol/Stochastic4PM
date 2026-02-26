import {
  PrismaClient,
  Role,
  TaskStatus,
  TaskType,
  Priority,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.statusEvent.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash("Password123!", 12);

  // Create users
  const pm = await prisma.user.create({
    data: {
      name: "Project Manager",
      email: "pm@thesis.local",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const member1 = await prisma.user.create({
    data: {
      name: "Member One",
      email: "member1@thesis.local",
      passwordHash,
      role: Role.MEMBER,
    },
  });

  const member2 = await prisma.user.create({
    data: {
      name: "Member Two",
      email: "member2@thesis.local",
      passwordHash,
      role: Role.MEMBER,
    },
  });

  // Create sprint (current date range: last week to next 2 weeks)
  const now = new Date();
  const sprintStart = new Date(now);
  sprintStart.setDate(sprintStart.getDate() - 7);
  const sprintEnd = new Date(now);
  sprintEnd.setDate(sprintEnd.getDate() + 14);

  const sprint = await prisma.sprint.create({
    data: {
      name: "Sprint 1 - Foundation",
      startDate: sprintStart,
      endDate: sprintEnd,
    },
  });

  // Helper to create dates relative to now
  const daysFromNow = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    return date;
  };

  // Create 6 sprint tasks across all statuses
  const sprintTask1 = await prisma.task.create({
    data: {
      title: "Setup project repository",
      description:
        "Initialize the project with Next.js, configure linters and CI.",
      status: TaskStatus.DONE,
      type: TaskType.SPRINT_TASK,
      priority: Priority.HIGH,
      startDate: daysFromNow(-5),
      dueDate: daysFromNow(-3),
      sprintId: sprint.id,
      assignees: { connect: [{ id: member1.id }] },
      reporterId: pm.id,
    },
  });

  const sprintTask2 = await prisma.task.create({
    data: {
      title: "Design database schema",
      description: "Create Prisma schema based on data model spec.",
      status: TaskStatus.IN_REVIEW,
      type: TaskType.SPRINT_TASK,
      priority: Priority.HIGH,
      startDate: daysFromNow(-3),
      dueDate: daysFromNow(1),
      sprintId: sprint.id,
      assignees: { connect: [{ id: member1.id }] },
      reporterId: pm.id,
    },
  });

  const sprintTask3 = await prisma.task.create({
    data: {
      title: "Implement authentication",
      description: "Set up NextAuth with credentials provider.",
      status: TaskStatus.IN_PROGRESS,
      type: TaskType.SPRINT_TASK,
      priority: Priority.URGENT,
      startDate: daysFromNow(-1),
      dueDate: daysFromNow(3),
      sprintId: sprint.id,
      assignees: { connect: [{ id: member2.id }] },
      reporterId: pm.id,
    },
  });

  const sprintTask4 = await prisma.task.create({
    data: {
      title: "Build task CRUD API",
      description: "Create REST endpoints for tasks.",
      status: TaskStatus.TODO,
      type: TaskType.SPRINT_TASK,
      priority: Priority.MEDIUM,
      startDate: daysFromNow(2),
      dueDate: daysFromNow(7),
      sprintId: sprint.id,
      assignees: { connect: [{ id: member1.id }] },
      reporterId: pm.id,
    },
  });

  const sprintTask5 = await prisma.task.create({
    data: {
      title: "Create board view UI",
      description: "Implement Jira-like board with status columns.",
      status: TaskStatus.BACKLOG,
      type: TaskType.SPRINT_TASK,
      priority: Priority.MEDIUM,
      startDate: daysFromNow(5),
      dueDate: daysFromNow(10),
      sprintId: sprint.id,
      assignees: { connect: [{ id: member2.id }] },
      reporterId: pm.id,
    },
  });

  const sprintTask6 = await prisma.task.create({
    data: {
      title: "Fix login redirect issue",
      description: "Users are not redirected correctly after login.",
      status: TaskStatus.BLOCKED,
      type: TaskType.SPRINT_TASK,
      priority: Priority.LOW,
      startDate: daysFromNow(0),
      dueDate: daysFromNow(4),
      sprintId: sprint.id,
      assignees: { connect: [{ id: member2.id }] },
      reporterId: pm.id,
    },
  });

  // Add subtasks to sprint task 4
  await prisma.task.create({
    data: {
      title: "Create GET /api/tasks endpoint",
      description: "List tasks with filters.",
      status: TaskStatus.TODO,
      type: TaskType.SPRINT_TASK,
      priority: Priority.MEDIUM,
      startDate: daysFromNow(2),
      dueDate: daysFromNow(4),
      sprintId: sprint.id,
      assignees: { connect: [{ id: member1.id }] },
      reporterId: pm.id,
      parentId: sprintTask4.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Create POST /api/tasks endpoint",
      description: "Create new tasks with validation.",
      status: TaskStatus.TODO,
      type: TaskType.SPRINT_TASK,
      priority: Priority.MEDIUM,
      startDate: daysFromNow(3),
      dueDate: daysFromNow(5),
      sprintId: sprint.id,
      assignees: { connect: [{ id: member1.id }] },
      reporterId: pm.id,
      parentId: sprintTask4.id,
    },
  });

  // Create 4 general tasks
  await prisma.task.create({
    data: {
      title: "Submit thesis proposal draft",
      description: "Compile research questions and submit to advisor.",
      status: TaskStatus.IN_PROGRESS,
      type: TaskType.GENERAL_TASK,
      priority: Priority.URGENT,
      dueDate: daysFromNow(5),
      assignees: { connect: [{ id: member1.id }] },
      reporterId: pm.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Review literature survey",
      description: "Complete review of 20 papers for related work section.",
      status: TaskStatus.TODO,
      type: TaskType.GENERAL_TASK,
      priority: Priority.HIGH,
      dueDate: daysFromNow(10),
      assignees: { connect: [{ id: member2.id }] },
      reporterId: pm.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Schedule meeting with advisor",
      description: "Book a 30-min slot next week.",
      status: TaskStatus.BACKLOG,
      type: TaskType.GENERAL_TASK,
      priority: Priority.LOW,
      dueDate: daysFromNow(7),
      assignees: { connect: [{ id: pm.id }] },
      reporterId: pm.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Prepare mid-term presentation",
      description: "Slides + demo for mid-term review.",
      status: TaskStatus.TODO,
      type: TaskType.GENERAL_TASK,
      priority: Priority.MEDIUM,
      dueDate: daysFromNow(20),
      assignees: { connect: [{ id: member1.id }] },
      reporterId: pm.id,
    },
  });

  // Add a comment to a sprint task
  await prisma.comment.create({
    data: {
      taskId: sprintTask3.id,
      authorId: pm.id,
      body: "Please prioritize this. We need auth before any other feature.",
    },
  });

  await prisma.comment.create({
    data: {
      taskId: sprintTask3.id,
      authorId: member2.id,
      body: "Working on it now. Should be done by tomorrow.",
    },
  });

  console.log("Seed completed successfully!");
  console.log(`  Admin: pm@thesis.local / Password123!`);
  console.log(`  Member 1: member1@thesis.local / Password123!`);
  console.log(`  Member 2: member2@thesis.local / Password123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
