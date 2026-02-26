import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { updateTaskSchema } from "@/lib/validations";

// GET /api/tasks/:id — task detail with subtasks, comments, attachments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      reporter: { select: { id: true, name: true, email: true } },
      sprint: { select: { id: true, name: true } },
      subtasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      comments: {
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: {
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      statusLog: {
        include: {
          actor: { select: { id: true, name: true } },
        },
        orderBy: { at: "desc" },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

// PATCH /api/tasks/:id — update task
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  // Check permissions: ADMIN, assignee, or reporter
  const existingTask = await prisma.task.findUnique({ where: { id } });
  if (!existingTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const isAdmin = user.role === "ADMIN";
  const isAssignee = existingTask.assigneeId === user.id;
  const isReporter = existingTask.reporterId === user.id;
  if (!isAdmin && !isAssignee && !isReporter) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only ADMIN can change sprintId
  if (parsed.data.sprintId !== undefined && !isAdmin) {
    return NextResponse.json(
      { error: "Only admins can change sprint assignment" },
      { status: 403 },
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.description !== undefined)
    data.description = parsed.data.description;
  if (parsed.data.priority !== undefined) data.priority = parsed.data.priority;
  if (parsed.data.startDate !== undefined)
    data.startDate = parsed.data.startDate
      ? new Date(parsed.data.startDate)
      : null;
  if (parsed.data.dueDate !== undefined)
    data.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
  if (parsed.data.sprintId !== undefined) data.sprintId = parsed.data.sprintId;
  if (parsed.data.assigneeId !== undefined)
    data.assigneeId = parsed.data.assigneeId;

  // Handle status change → create StatusEvent
  if (
    parsed.data.status !== undefined &&
    parsed.data.status !== existingTask.status
  ) {
    data.status = parsed.data.status;
    await prisma.statusEvent.create({
      data: {
        taskId: id,
        actorId: user.id,
        from: existingTask.status,
        to: parsed.data.status,
      },
    });
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      reporter: { select: { id: true, name: true, email: true } },
      sprint: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(task);
}

// DELETE /api/tasks/:id — delete task + subtasks
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Only ADMIN, reporter, or assignee can delete
  if (
    user.role !== "ADMIN" &&
    task.reporterId !== user.id &&
    task.assigneeId !== user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete subtasks first (cascade in code)
  const subtaskIds = await prisma.task.findMany({
    where: { parentId: id },
    select: { id: true },
  });

  for (const sub of subtaskIds) {
    await prisma.statusEvent.deleteMany({ where: { taskId: sub.id } });
    await prisma.comment.deleteMany({ where: { taskId: sub.id } });
    await prisma.attachment.deleteMany({ where: { taskId: sub.id } });
    await prisma.task.delete({ where: { id: sub.id } });
  }

  // Clean up parent task's own relations before deleting
  await prisma.statusEvent.deleteMany({ where: { taskId: id } });
  await prisma.comment.deleteMany({ where: { taskId: id } });
  await prisma.attachment.deleteMany({ where: { taskId: id } });
  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
