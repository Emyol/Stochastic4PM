import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { del } from "@vercel/blob";

// GET /api/attachments/:id — redirect to Vercel Blob URL
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    return NextResponse.json(
      { error: "Attachment not found" },
      { status: 404 },
    );
  }

  // storedName now holds the Vercel Blob public URL — redirect to it
  return NextResponse.redirect(attachment.storedName);
}

// DELETE /api/attachments/:id — delete attachment (ADMIN or uploader)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    return NextResponse.json(
      { error: "Attachment not found" },
      { status: 404 },
    );
  }

  if (user.role !== "ADMIN" && attachment.uploadedById !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete from Vercel Blob
  try {
    await del(attachment.storedName);
  } catch {
    // Blob may already be gone; continue with DB cleanup
  }

  await prisma.attachment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
