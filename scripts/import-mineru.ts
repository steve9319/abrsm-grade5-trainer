import path from "path";
import { loadDotEnv } from "@/lib/env";
import { importMineru } from "@/lib/mineru";
import { privateBankDir } from "@/lib/private-bank";

function flagValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function main() {
  loadDotEnv(process.cwd(), process.env);
  const inputDir = process.argv.slice(2).find((arg) => !arg.startsWith("--") && arg !== flagValue("--year") && arg !== flagValue("--paper") && arg !== flagValue("--out"));
  if (!inputDir) {
    console.error("Usage: npm run import-mineru -- <mineru-folder> [--year 2024] [--paper A] [--out private-bank]");
    process.exit(1);
  }
  const yearText = flagValue("--year");
  const year = yearText ? Number(yearText) : undefined;
  if (yearText && !Number.isInteger(year)) {
    console.error("--year must be an integer");
    process.exit(1);
  }
  const result = importMineru({
    inputDir: path.resolve(inputDir),
    outDir: flagValue("--out") ? path.resolve(flagValue("--out") as string) : privateBankDir(),
    year,
    paper: flagValue("--paper"),
  });
  console.log(`Wrote ${result.questions.length} question${result.questions.length === 1 ? "" : "s"} to ${result.writtenFile}`);
  console.log(`Report: ${result.reportFile}`);
  if (result.report.lowConfidence.length > 0) {
    console.log("Low confidence:");
    for (const item of result.report.lowConfidence) {
      console.log(`- ${item.questionNumber ?? "unknown"}: ${item.reasons.join(", ")}`);
    }
  } else {
    console.log("No low-confidence questions.");
  }
}

main();
