import path from "path";
import { runAnswerCheck } from "@/lib/answer-check";
import { loadDotEnv } from "@/lib/env";
import { QUESTIONS_DIR } from "@/lib/questions.server";

function flagValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

async function main() {
  loadDotEnv(process.cwd(), process.env);
  const id = flagValue("--id");
  const result = await runAnswerCheck({
    env: process.env,
    questionsDir: QUESTIONS_DIR,
    dryRun: process.argv.includes("--dry-run"),
    force: process.argv.includes("--force"),
    ids: id ? [id] : undefined,
    delayMs: 250,
  });

  if (result.skipped) {
    console.log(result.reason);
    process.exit(0);
  }

  console.log(`Checked ${result.checked} question${result.checked === 1 ? "" : "s"}.`);
  if (result.disagreements.length > 0) {
    console.log(`Disagreements flagged, stored answers kept: ${result.disagreements.join(", ")}`);
  } else {
    console.log("No disagreements.");
  }
  if (result.filled.length > 0) {
    console.log(`Blank explanations filled: ${result.filled.join(", ")}`);
  }
  if (result.failed.length > 0) {
    console.log(`Could not check: ${result.failed.join(", ")}`);
  }
  if (result.written.length > 0) {
    console.log(`Updated ${result.written.map((file) => path.basename(file)).join(", ")}`);
  } else {
    console.log("No files written.");
  }
  process.exit(result.failed.length > 0 ? 1 : 0);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Answer check failed";
  console.error(message);
  process.exit(1);
});
