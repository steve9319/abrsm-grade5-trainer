import fs from "fs";
import path from "path";

export function parseEnv(text: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

/** Load `.env` then `.env.local`. Existing non-empty variables are left as they are. */
export function loadDotEnv(dir: string, env: Record<string, string | undefined>): void {
  const preset = new Set(
    Object.entries(env)
      .filter(([, value]) => typeof value === "string" && value.trim() !== "")
      .map(([key]) => key),
  );
  const merged: Record<string, string> = {};
  for (const name of [".env", ".env.local"]) {
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) continue;
    Object.assign(merged, parseEnv(fs.readFileSync(file, "utf8")));
  }
  for (const [key, value] of Object.entries(merged)) {
    if (!preset.has(key)) env[key] = value;
  }
}
