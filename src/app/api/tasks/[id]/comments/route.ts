import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { createCommentSchema } from "@/lib/validations";

// POST /api/tasks/:id/comments — add comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;
  const body = await req.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  // Verify task exists
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: {
      taskId,
      authorId: user.id,
      body: parsed.data.body,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
