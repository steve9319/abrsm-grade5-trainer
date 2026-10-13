import { EXPLANATION_UNAVAILABLE_TEXT } from "@/lib/copy";
import { DEFAULT_ANTHROPIC_MODEL } from "@/lib/explain";

export interface LessonInput {
  topic?: string;
  subtopic?: string;
  title?: string;
}

export type LessonBody =
  | { available: true; lesson: string; model: string }
  | { available: false; message: typeof EXPLANATION_UNAVAILABLE_TEXT };

type Env = {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
};

function unavailable(status: number): { status: number; body: LessonBody } {
  return { status, body: { available: false, message: EXPLANATION_UNAVAILABLE_TEXT } };
}

export function buildLessonPrompt(input: LessonInput): string {
  return [
    "You are a careful ABRSM Grade 5 music theory teacher helping a piano student.",
    "Write a short revision lesson, 120 words or fewer, for the concept below.",
    "Use British note names (semibreve, minim, crotchet, quaver) and British theory terms.",
    "Teach the method the student should use on the next few questions.",
    "Do not write a multiple-choice question, and do not quote exam papers.",
    "Reply with JSON only, no markdown: {\"lesson\":\"...\"}",
    "",
    `Topic: ${input.topic ?? ""}`,
    `Concept: ${input.title ?? input.subtopic ?? ""}`,
  ].join("\n");
}

export function parseLessonPayload(text: string): string | null {
  const stripped = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(stripped.slice(start, end + 1)) as { lesson?: unknown };
    if (typeof parsed.lesson !== "string" || !parsed.lesson.trim()) return null;
    return parsed.lesson.trim();
  } catch {
    return null;
  }
}

export async function requestLesson(
  input: LessonInput,
  env: Env,
  fetchImpl: typeof fetch = fetch,
): Promise<{ status: number; body: LessonBody }> {
  const apiKey = env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return unavailable(200);
  if (!input.topic?.trim() || !input.subtopic?.trim()) return unavailable(400);

  const model = env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
  try {
    const response = await fetchImpl("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        messages: [{ role: "user", content: buildLessonPrompt(input) }],
      }),
    });
    if (!response.ok) return unavailable(200);
    const data = (await response.json()) as { content?: { type?: string; text?: string }[] };
    const text = (data.content ?? [])
      .filter((block) => block.type === "text" && typeof block.text === "string")
      .map((block) => block.text)
      .join("\n");
    const lesson = parseLessonPayload(text);
    if (!lesson) return unavailable(200);
    return { status: 200, body: { available: true, lesson, model } };
  } catch {
    return unavailable(200);
  }
}
