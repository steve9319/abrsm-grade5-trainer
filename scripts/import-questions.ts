import path from "path";
import { importQuestionFile } from "@/lib/import-bank";
import { privateBankDir } from "@/lib/private-bank";

const USAGE = `Add questions you have the right to store to the bank.

Usage:
  npm run import-questions -- <file.json|file.csv> [options]

Options:
  --out <file>                     Destination for new ids (default: <private bank>/imported.json)
  --replace                        Overwrite a question when its id is already in the bank
  --dry-run                        Validate and report without writing
  --allow-missing-explanations     Accept blank explanations
  --bank <dir>                     Question directory (default: PRIVATE_BANK_DIR or ./private-bank)

CSV columns:
  id,topic,source,question,notation,notationAlt,correctAnswer,explanation,
  optionA,explanationA,optionB,explanationB,optionC,explanationC,optionD,explanationD

In CSV, write ABC line breaks as \\n inside the notation field.
JSON may be one question, an array, or { "questions": [ ... ] }.

Do not commit verbatim ABRSM (or other publisher) paper text to a public repository.
Use source for your own citation, for example "original" or "ABRSM 2023 Paper A Q3".
`;

function parseArgs(argv: string[]) {
  const flags = new Set<string>();
  const positionals: string[] = [];
  let out: string | undefined;
  let bank: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") flags.add("--help");
    else if (arg === "--out") out = argv[++index];
    else if (arg === "--bank") bank = argv[++index];
    else if (arg?.startsWith("--")) flags.add(arg);
    else if (arg) positionals.push(arg);
  }
  return { input: positionals[0], out, bank, flags };
}

const args = parseArgs(process.argv.slice(2));
if (args.flags.has("--help") || !args.input) {
  console.log(USAGE);
  process.exit(args.flags.has("--help") ? 0 : 1);
}

const bankDir = path.resolve(args.bank ?? privateBankDir());
const outPath = path.resolve(args.out ?? path.join(bankDir, "imported.json"));

try {
  const result = importQuestionFile({
    inputPath: path.resolve(args.input),
    outPath,
    bankDir,
    replace: args.flags.has("--replace"),
    dryRun: args.flags.has("--dry-run"),
    allowMissingExplanations: args.flags.has("--allow-missing-explanations"),
  });
  const verb = args.flags.has("--dry-run") ? "Would add" : "Added";
  console.log(`${verb} ${result.added.length}: ${result.added.join(", ") || "(none)"}`);
  console.log(`Replaced ${result.replaced.length}: ${result.replaced.join(", ") || "(none)"}`);
  if (!args.flags.has("--dry-run")) {
    console.log(`Wrote ${result.written.join(", ") || "(no changes)"}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
