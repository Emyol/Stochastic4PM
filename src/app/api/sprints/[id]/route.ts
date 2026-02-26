import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/session";
import { updateSprintSchema } from "@/lib/validations";

// GET /api/sprints/:id — sprint detail + tasks
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const sprint = await prisma.sprint.findUnique({
    where: { id },
    include: {
      tasks: {
        where: { parentId: null },
        include: {
          assignees: { select: { id: true, name: true, email: true } },
          _count: { select: { subtasks: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!sprint) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  return NextResponse.json(sprint);
}

// PATCH /api/sprints/:id — update sprint (ADMIN only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSprintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.startDate) data.startDate = new Date(parsed.data.startDate);
  if (parsed.data.endDate) data.endDate = new Date(parsed.data.endDate);

  const sprint = await prisma.sprint.update({
    where: { id },
    data,
  });

  return NextResponse.json(sprint);
}

// DELETE /api/sprints/:id — delete sprint (ADMIN only, only if no tasks)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const taskCount = await prisma.task.count({ where: { sprintId: id } });
  if (taskCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete sprint with tasks. Remove tasks first." },
      { status: 400 },
    );
  }

  await prisma.sprint.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
