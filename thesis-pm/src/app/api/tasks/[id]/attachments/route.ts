import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from "@/lib/validations";
import { put } from "@vercel/blob";

// POST /api/tasks/:id/attachments — upload attachment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;

  // Verify task exists
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 25 MB." },
      { status: 400 },
    );
  }

  // Validate extension
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      {
        error: `File type .${ext} is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // Upload to Vercel Blob
  const blob = await put(`attachments/${taskId}/${file.name}`, file, {
    access: "public",
  });

  // Create DB record — storedName holds the Vercel Blob URL
  const attachment = await prisma.attachment.create({
    data: {
      taskId,
      originalName: file.name,
      storedName: blob.url,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      uploadedById: user.id,
    },
    include: {
      uploadedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(attachment, { status: 201 });
}
