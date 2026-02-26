import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { createTaskSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

// GET /api/tasks — list tasks with filters
export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const sprintId = searchParams.get("sprintId");
  const assigneeId = searchParams.get("assigneeId");
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const parentId = searchParams.get("parentId");

  const where: Prisma.TaskWhereInput = {};
  if (type) where.type = type as Prisma.EnumTaskTypeFilter["equals"];
  if (sprintId) where.sprintId = sprintId;
  if (assigneeId) where.assigneeId = assigneeId;
  if (status) where.status = status as Prisma.EnumTaskStatusFilter["equals"];
  if (q) where.title = { contains: q, mode: "insensitive" };
  if (parentId === "null") {
    where.parentId = null;
  } else if (parentId) {
    where.parentId = parentId;
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      reporter: { select: { id: true, name: true, email: true } },
      sprint: { select: { id: true, name: true } },
      _count: { select: { subtasks: true, comments: true, attachments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

// POST /api/tasks — create task
export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const {
    title,
    description,
    type,
    priority,
    status,
    startDate,
    dueDate,
    sprintId,
    assigneeId,
    parentId,
  } = parsed.data;

  // If parentId is set, inherit type and sprintId from parent
  let resolvedType = type;
  let resolvedSprintId = sprintId;
  if (parentId) {
    const parent = await prisma.task.findUnique({ where: { id: parentId } });
    if (!parent) {
      return NextResponse.json(
        { error: "Parent task not found" },
        { status: 400 },
      );
    }
    resolvedType = parent.type;
    resolvedSprintId = parent.sprintId;
  }

  // Enforce invariant: SPRINT_TASK requires sprintId
  if (resolvedType === "SPRINT_TASK" && !resolvedSprintId) {
    return NextResponse.json(
      { error: "Sprint tasks must have a sprintId" },
      { status: 400 },
    );
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description || "",
      type: resolvedType,
      priority: priority || "MEDIUM",
      status: status || "BACKLOG",
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      sprintId: resolvedSprintId || null,
      assigneeId: assigneeId || null,
      reporterId: user.id,
      parentId: parentId || null,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      reporter: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
