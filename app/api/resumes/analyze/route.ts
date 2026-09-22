import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { checkRateLimit } from "@/lib/utilities/rate-limit";
import {
  ACCEPTED_RESUME_MIME_TYPES,
  MAX_RESUME_FILE_BYTES,
  analyzeResumeSchema,
} from "@/lib/validation/resume";
import { analyzeResume, uploadResume } from "@/server/services/resume.service";

const RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 }; // 5 analyses / hour / user

export async function POST(request: Request) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed, retryAfterMs } = await checkRateLimit(`resume-analyze:${user.id}`, RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "You've reached the resume analysis limit. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    let resumeId: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const targetRole = formData.get("targetRole");

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      if (!ACCEPTED_RESUME_MIME_TYPES.includes(file.type as never)) {
        return NextResponse.json(
          { error: "Only PDF and DOCX files are supported" },
          { status: 400 },
        );
      }
      if (file.size > MAX_RESUME_FILE_BYTES) {
        return NextResponse.json({ error: "File is too large (max 5MB)" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const resume = await uploadResume(user.id, {
        buffer,
        mimeType: file.type,
        title: file.name.replace(/\.[^.]+$/, "") || "Uploaded resume",
      });
      resumeId = resume.id;

      const analysis = await analyzeResume(
        user.id,
        resumeId,
        typeof targetRole === "string" ? targetRole : undefined,
      );
      return NextResponse.json({ data: { resumeId, analysis } }, { status: 201 });
    }

    const body = await request.json().catch(() => null);
    const parsed = analyzeResumeSchema.safeParse(body);
    if (!parsed.success || !parsed.data.resumeId) {
      return NextResponse.json({ error: "resumeId is required" }, { status: 400 });
    }

    const analysis = await analyzeResume(user.id, parsed.data.resumeId, parsed.data.targetRole);
    return NextResponse.json(
      { data: { resumeId: parsed.data.resumeId, analysis } },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze resume";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
