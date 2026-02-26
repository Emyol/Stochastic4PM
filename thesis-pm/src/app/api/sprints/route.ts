import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/session";
import { createSprintSchema } from "@/lib/validations";

// GET /api/sprints — list sprints (authenticated)
export async function GET() {
  const user = await requireAuth();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sprints = await prisma.sprint.findMany({
    include: {
      _count: { select: { tasks: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(sprints);
}

// POST /api/sprints — create sprint (ADMIN only)
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSprintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const sprint = await prisma.sprint.create({
    data: {
      name: parsed.data.name,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    },
  });

  return NextResponse.json(sprint, { status: 201 });
}
