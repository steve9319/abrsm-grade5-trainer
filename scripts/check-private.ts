import path from "path";
import { loadDotEnv } from "@/lib/env";
import { fillPrivateAnswers } from "@/lib/private-answers";

async function main() {
  loadDotEnv(process.cwd(), process.env);
  const result = await fillPrivateAnswers({
    env: process.env,
    dryRun: process.argv.includes("--dry-run"),
  });
  if (result.skipped) {
    console.log(result.reason);
    process.exit(0);
  }
  console.log(`Filled ${result.filled.length} private question${result.filled.length === 1 ? "" : "s"}.`);
  if (result.flagged.length > 0) {
    console.log(`Handwritten answers that differ from Claude: ${result.flagged.join(", ")}`);
  }
  if (result.failed.length > 0) {
    console.log(`Could not generate an answer: ${result.failed.join(", ")}`);
  }
  if (result.written.length > 0) {
    console.log(`Updated ${result.written.map((file) => path.basename(file)).join(", ")}`);
  } else {
    console.log("No files written.");
  }
  process.exit(result.failed.length > 0 ? 1 : 0);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Private answer check failed");
  process.exit(1);
});
