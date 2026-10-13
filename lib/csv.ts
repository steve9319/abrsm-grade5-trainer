import type { Question } from "@/lib/types";

export function parseCsv(text: string): Record<string, string>[] {
  const source = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += character;
      }
      continue;
    }
    if (character === '"') {
      inQuotes = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (character !== "\r") {
      cell += character;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const header = rows.shift();
  if (!header) return [];
  const keys = header.map((key) => key.trim());
  return rows
    .filter((cells) => cells.some((value) => value.trim()))
    .map((cells) => {
      const record: Record<string, string> = {};
      keys.forEach((key, index) => {
        if (key) record[key] = cells[index] ?? "";
      });
      return record;
    });
}

const OPTION_IDS = ["A", "B", "C", "D", "E", "F"] as const;

export function questionFromCsvRow(row: Record<string, string>): Question {
  const options = OPTION_IDS.flatMap((id) => {
    const text = row[`option${id}`]?.trim() ?? "";
    const explanation = row[`explanation${id}`]?.trim() ?? "";
    if (!text && !explanation) return [];
    return [{ id, text, explanation }];
  });
  const notation = (row.notation ?? "").replace(/\\n/g, "\n").trim();
  const notationAlt = row.notationAlt?.trim();
  return {
    id: (row.id ?? "").trim(),
    topic: (row.topic ?? "").trim(),
    source: (row.source ?? "").trim(),
    question: (row.question ?? "").trim(),
    ...(notation ? { notation } : {}),
    ...(notationAlt ? { notationAlt } : {}),
    options,
    correctAnswer: (row.correctAnswer ?? "").trim(),
    explanation: (row.explanation ?? "").trim(),
  };
}
