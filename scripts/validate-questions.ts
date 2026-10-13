import { loadQuestions } from "@/lib/questions.server";
import { TOPIC_IDS } from "@/lib/types";

try {
  const questions = loadQuestions();
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
