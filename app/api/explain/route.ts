import { NextResponse } from "next/server";
import { EXPLANATION_UNAVAILABLE_TEXT } from "@/lib/copy";
import { requestExplanation, type ExplainInput } from "@/lib/explain";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: ExplainInput;
  try {
    body = (await request.json()) as ExplainInput;
  } catch {
    return NextResponse.json({ available: false, message: EXPLANATION_UNAVAILABLE_TEXT }, { status: 400 });
  }
  const result = await requestExplanation(body, {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  });
  return NextResponse.json(result.body, { status: result.status });
}
