import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { getResume } from "@/server/services/resume.service";
import { getStorageService } from "@/lib/storage";

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const resume = await getResume(user.id, id);
  if (!resume?.fileUrl) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const buffer = await getStorageService().read(resume.fileUrl);
  if (!buffer) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext = resume.fileUrl.split(".").pop() ?? "";
  const contentType = CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${resume.title}.${ext}"`,
    },
  });
}
