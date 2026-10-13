import { NextResponse } from "next/server";
import { EXPLANATION_UNAVAILABLE_TEXT } from "@/lib/copy";
import { requestLesson, type LessonInput } from "@/lib/lesson";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: LessonInput;
  try {
    body = (await request.json()) as LessonInput;
  } catch {
    return NextResponse.json({ available: false, message: EXPLANATION_UNAVAILABLE_TEXT }, { status: 400 });
  }
  const result = await requestLesson(body, {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  });
  return NextResponse.json(result.body, { status: result.status });
}
