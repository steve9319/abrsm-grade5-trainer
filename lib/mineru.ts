import fs from "fs";
import path from "path";
import type { Question } from "@/lib/types";

export interface StreamItem {
  kind: "text" | "image";
  text: string;
  /** Equation blocks are notation, not prose. */
  equation?: boolean;
  caption?: string;
}

export interface MineruReportItem {
  questionNumber?: string;
  reasons: string[];
  excerpt: string;
}

export interface MineruReport {
  written: string[];
  skipped: string[];
  lowConfidence: MineruReportItem[];
}

export interface MineruImportOptions {
  inputDir: string;
  outDir: string;
  year?: number;
  paper?: string;
}

export interface MineruImportResult {
  questions: Question[];
  report: MineruReport;
  writtenFile: string;
  reportFile: string;
}

const SECTION_TOPICS: Record<string, string> = {
  "1": "rhythm",
  "2": "pitch",
  "3": "keys",
  "4": "intervals",
  "5": "chords",
  "6": "terms",
  "7": "context",
  "8": "ornaments",
};

const QUESTION_START = /^(?:question\s+)?(\d+(?:\.\d+)*)(?:\s*[.)])?\s*([\s\S]*)$/i;
const OPTION_LINE = /^(?:\(([A-F])\)|([A-F])[.)]|([A-F]))\s+(.+)$/;
const ANSWER_LINE = /^(?:handwritten\s+answer|student\s+answer|answer)\s*[:.-]\s*(.+)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

/** True when OCR output is mostly symbols rather than words. */
export function isGarbled(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 6) return false;
  if (trimmed.includes("\uFFFD")) return true;
  if (/[?#~|]{2,}/.test(trimmed) || /@{1,}.*#{2,}/.test(trimmed)) return true;
  const symbols = trimmed.replace(/[A-Za-z0-9\s.,;:'"()[\]\-–—/&]/g, "");
  return symbols.length / trimmed.length > 0.2;
}

export function streamFromContentList(blocks: unknown[]): StreamItem[] {
  const items: StreamItem[] = [];
  for (const block of blocks) {
    if (!isRecord(block)) continue;
    const type = typeof block.type === "string" ? block.type : "text";
    if (["header", "footer", "page_number", "page_footnote", "aside_text"].includes(type)) continue;
    if (type === "image" || type === "chart") {
      const caption = strings(block.image_caption ?? block.chart_caption).join(" ");
      items.push({ kind: "image", text: typeof block.img_path === "string" ? block.img_path : "", caption });
      continue;
    }
    if (type === "table") {
      const caption = strings(block.table_caption).join(" ");
      if (typeof block.img_path === "string" && block.img_path.trim()) {
        items.push({ kind: "image", text: block.img_path, caption });
      }
      if (typeof block.table_body === "string" && block.table_body.trim()) {
        items.push({ kind: "text", text: block.table_body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() });
      }
      continue;
    }
    if (type === "list" && Array.isArray(block.list_items)) {
      for (const item of block.list_items) {
        if (typeof item === "string" && item.trim()) items.push({ kind: "text", text: item.trim() });
      }
      continue;
    }
    const raw = typeof block.text === "string" ? block.text : "";
    if (type === "equation") {
      items.push({ kind: "text", text: raw.trim(), equation: true });
      continue;
    }
    for (const line of raw.split(/\n/)) {
      if (line.trim()) items.push({ kind: "text", text: line.trim() });
    }
  }
  return items;
}

export function streamFromMarkdown(markdown: string): StreamItem[] {
  const items: StreamItem[] = [];
  for (const line of markdown.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") continue;
    const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(trimmed);
    if (image) {
      items.push({ kind: "image", text: image[2] ?? "", caption: image[1] ?? "" });
      continue;
    }
    items.push({ kind: "text", text: trimmed.replace(/^#+\s*/, "") });
  }
  return items;
}

interface Draft {
  number: string;
  stem: string[];
  options: { id: string; text: string }[];
  images: { path: string; caption: string }[];
  studentAnswer?: string;
  marks?: number;
  garbled: boolean;
  unreadable: boolean;
}

function takeMarks(text: string, draft: Draft): string {
  const match = text.match(/\((\d+)\s*marks?\)/i);
  if (match?.[1] && draft.marks === undefined) draft.marks = Number(match[1]);
  return text.replace(/\(\d+\s*marks?\)/gi, "").replace(/\s+/g, " ").trim();
}

function normaliseAnswerToken(value: string): string {
  const token = value.trim().match(/^(?:\(([A-F])\)|([A-F])\b)/i);
  return (token?.[1] || token?.[2] || value).trim();
}

export function questionsFromStream(
  items: StreamItem[],
  meta: { year?: number; paper?: string; resolveImage?: (relativePath: string) => boolean },
): { questions: Question[]; report: MineruReport } {
  const drafts: Draft[] = [];
  let current: Draft | null = null;
  const pendingImages: { path: string; caption: string }[] = [];

  function start(number: string, rest: string): Draft {
    const draft: Draft = {
      number,
      stem: [],
      options: [],
      images: [...pendingImages],
      garbled: false,
      unreadable: pendingImages.some((image) => meta.resolveImage?.(image.path) === false),
    };
    pendingImages.length = 0;
    drafts.push(draft);
    const cleaned = takeMarks(rest, draft);
    if (cleaned) draft.stem.push(cleaned);
    if (cleaned && isGarbled(cleaned)) draft.garbled = true;
    return draft;
  }

  for (const item of items) {
    if (item.kind === "image") {
      const image = { path: item.text, caption: item.caption ?? "" };
      const missing = !item.text.trim() || meta.resolveImage?.(item.text) === false;
      if (current) {
        if (missing) current.unreadable = true;
        current.images.push(image);
      } else pendingImages.push(image);
      continue;
    }

    if (item.equation) {
      const broken = !item.text || isGarbled(item.text);
      if (current) {
        if (broken) current.unreadable = true;
        if (item.text) current.stem.push(item.text);
        if (item.text && isGarbled(item.text)) current.garbled = true;
      }
      continue;
    }

    const answer = ANSWER_LINE.exec(item.text);
    if (answer?.[1] && current) {
      current.studentAnswer = normaliseAnswerToken(answer[1]);
      continue;
    }

    const startMatch = QUESTION_START.exec(item.text);
    if (startMatch?.[1]) {
      const rest = startMatch[2] ?? "";
      const looksLikeQuestion = rest.length > 0 || item.text.trim() === startMatch[1];
      if (looksLikeQuestion && !OPTION_LINE.test(item.text)) {
        current = start(startMatch[1], rest);
        continue;
      }
    }

    if (!current) continue;
    const active = current;
    const option = OPTION_LINE.exec(item.text);
    if (option) {
      const id = (option[1] || option[2] || option[3] || "").toUpperCase();
      const text = takeMarks(option[4] ?? "", active);
      if (id && text) active.options.push({ id, text });
      if (text && isGarbled(text)) active.garbled = true;
      continue;
    }

    const cleaned = takeMarks(item.text, active);
    if (!cleaned) continue;
    active.stem.push(cleaned);
    if (isGarbled(cleaned)) active.garbled = true;
  }

  const questions: Question[] = [];
  const report: MineruReport = { written: [], skipped: [], lowConfidence: [] };

  for (const draft of drafts) {
    const stem = draft.stem.join(" ").replace(/\s+/g, " ").trim();
    const reasons: string[] = [];
    if (draft.options.length < 2) reasons.push("missing options");
    if (draft.unreadable || draft.images.some((image) => meta.resolveImage?.(image.path) === false)) {
      reasons.push("unreadable notation");
    }
    if (draft.garbled) reasons.push("garbled OCR");
    const section = draft.number.split(".")[0] ?? "";
    const topic = SECTION_TOPICS[section];
    if (!topic) reasons.push("unmapped section");
    if (reasons.length > 0) {
      report.lowConfidence.push({
        questionNumber: draft.number,
        reasons: [...new Set(reasons)],
        excerpt: stem.slice(0, 180) || draft.number,
      });
    }
    if (draft.options.length < 2 || !stem) {
      report.skipped.push(draft.number);
      continue;
    }
    const id = ["private", meta.year ? String(meta.year) : "paper", (meta.paper || "set").toLowerCase().replace(/[^a-z0-9]+/g, "") || "set", draft.number.replace(/\./g, "-")]
      .join("-")
      .replace(/[^a-z0-9-]/g, "");
    const image = draft.images.find((item) => item.path.trim() && meta.resolveImage?.(item.path) !== false);
    const question: Question = {
      id,
      topic: topic ?? "context",
      subtopic: "from-paper",
      source: "My papers",
      question: stem,
      options: draft.options.map((option) => ({ id: option.id, text: option.text, explanation: "" })),
      correctAnswer: "",
      explanation: "",
      ...(meta.year ? { year: meta.year } : {}),
      ...(meta.paper ? { paper: meta.paper } : {}),
      questionNumber: draft.number,
      ...(draft.marks ? { marks: draft.marks } : {}),
      ...(image ? { imagePath: image.path, notationAlt: image.caption || "Score excerpt" } : {}),
      ...(draft.studentAnswer ? { studentAnswer: draft.studentAnswer } : {}),
    };
    questions.push(question);
    report.written.push(id);
  }

  return { questions, report };
}

function findInDir(dir: string, test: (name: string) => boolean): string | null {
  if (!fs.existsSync(dir)) return null;
  const names = fs.readdirSync(dir);
  const direct = names.find(test);
  if (direct) return path.join(dir, direct);
  const nested = names
    .map((name) => path.join(dir, name))
    .filter((full) => fs.statSync(full).isDirectory());
  if (nested.length === 1) {
    const child = fs.readdirSync(nested[0] ?? "").find(test);
    if (child && nested[0]) return path.join(nested[0], child);
  }
  return null;
}

function studentDiffers(studentAnswer: string | undefined, correctAnswer: string): boolean {
  if (!studentAnswer?.trim() || !correctAnswer.trim()) return false;
  return normaliseAnswerToken(studentAnswer).toUpperCase() !== correctAnswer.trim().toUpperCase();
}

/** A second import updates the extract and keeps an answer Claude already wrote. */
function keepCachedAnswer(incoming: Question, previous: Question | undefined): Question {
  if (!previous) return incoming;
  const stored = previous.correctAnswer.trim();
  const hasCache = Boolean(stored || previous.explanation.trim() || previous.privateAnswer || previous.options.some((option) => option.explanation.trim()));
  if (!hasCache) return incoming;
  const correctAnswer = stored || incoming.correctAnswer;
  const studentAnswer = incoming.studentAnswer ?? previous.studentAnswer;
  const studentChanged = (incoming.studentAnswer ?? "") !== (previous.studentAnswer ?? "");
  let privateAnswer = previous.privateAnswer;
  if (privateAnswer && studentChanged) {
    const disagrees = studentDiffers(studentAnswer, correctAnswer);
    privateAnswer = {
      ...privateAnswer,
      studentDisagrees: disagrees,
      note: disagrees
        ? `Handwritten answer ${studentAnswer?.trim()} differs from Claude's answer ${privateAnswer.claudeAnswer}.`
        : studentAnswer?.trim()
          ? "Handwritten answer matches Claude."
          : "No handwritten answer was on the scan. Claude's answer was stored.",
    };
  }
  return {
    ...incoming,
    correctAnswer,
    explanation: previous.explanation.trim() || incoming.explanation,
    options: incoming.options.map((option) => {
      const old = previous.options.find((item) => item.id === option.id);
      return old?.explanation.trim() ? { ...option, explanation: old.explanation } : option;
    }),
    ...(studentAnswer ? { studentAnswer } : {}),
    ...(privateAnswer ? { privateAnswer } : {}),
  };
}

function imageExists(inputDir: string, relativePath: string): boolean {
  if (!relativePath.trim() || relativePath.includes("..")) return false;
  const root = path.resolve(inputDir);
  const full = path.resolve(root, relativePath.replace(/^\.\//, ""));
  if (full !== root && !full.startsWith(`${root}${path.sep}`)) return false;
  return fs.existsSync(full);
}

export function importMineru(options: MineruImportOptions): MineruImportResult {
  const contentListPath = findInDir(options.inputDir, (name) => name.endsWith("content_list.json"));
  const markdownPath = findInDir(options.inputDir, (name) => name.endsWith(".md"));
  const baseDir = contentListPath ? path.dirname(contentListPath) : markdownPath ? path.dirname(markdownPath) : options.inputDir;

  let items: StreamItem[] = [];
  if (contentListPath) {
    const parsed = JSON.parse(fs.readFileSync(contentListPath, "utf8")) as unknown;
    if (!Array.isArray(parsed)) throw new Error(`${path.basename(contentListPath)} must be a JSON array`);
    items = streamFromContentList(parsed);
  }
  const hasQuestion = items.some((item) => item.kind === "text" && QUESTION_START.test(item.text));
  if (!hasQuestion && markdownPath) {
    items = streamFromMarkdown(fs.readFileSync(markdownPath, "utf8"));
  }

  const built = questionsFromStream(items, {
    year: options.year,
    paper: options.paper,
    resolveImage: (relativePath) => imageExists(baseDir, relativePath),
  });

  fs.mkdirSync(options.outDir, { recursive: true });
  const imageDir = path.join(options.outDir, "images");
  fs.mkdirSync(imageDir, { recursive: true });
  for (const question of built.questions) {
    if (!question.imagePath) continue;
    const source = path.resolve(baseDir, question.imagePath.replace(/^\.\//, ""));
    if (!imageExists(baseDir, question.imagePath)) {
      delete question.imagePath;
      continue;
    }
    const ext = path.extname(source) || ".png";
    const targetName = `${question.id}${ext}`;
    fs.copyFileSync(source, path.join(imageDir, targetName));
    question.imagePath = path.posix.join("images", targetName);
  }

  const slug = [options.year ? String(options.year) : "", (options.paper || "").toLowerCase().replace(/[^a-z0-9]+/g, "")].filter(Boolean).join("-");
  const writtenFile = path.join(options.outDir, slug ? `mineru-${slug}.json` : "mineru.json");
  let existing: Question[] = [];
  if (fs.existsSync(writtenFile)) {
    const previous = JSON.parse(fs.readFileSync(writtenFile, "utf8")) as unknown;
    if (Array.isArray(previous)) existing = previous as Question[];
  }
  const byId = new Map(existing.map((question) => [question.id, question]));
  for (const question of built.questions) {
    byId.set(question.id, keepCachedAnswer(question, byId.get(question.id)));
  }
  const merged = [...byId.values()];
  fs.writeFileSync(writtenFile, `${JSON.stringify(merged, null, 2)}\n`);
  const reportFile = path.join(options.outDir, "import-report.json");
  fs.writeFileSync(reportFile, `${JSON.stringify(built.report, null, 2)}\n`);

  return { questions: built.questions, report: built.report, writtenFile, reportFile };
}
