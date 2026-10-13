import path from "path";
import { loadQuestions } from "@/lib/questions.server";
import { TOPIC_IDS } from "@/lib/types";

try {
  const questions = loadQuestions(path.join(process.cwd(), "tests", "fixtures", "questions"));
  console.log("Schema fixture (the app does not ship these questions):");
  const counts = new Map<string, number>();
  for (const question of questions) {
    counts.set(question.topic, (counts.get(question.topic) ?? 0) + 1);
  }
  console.log(`${questions.length} questions`);
  for (const topic of TOPIC_IDS) {
    console.log(`  ${topic}: ${counts.get(topic) ?? 0}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
