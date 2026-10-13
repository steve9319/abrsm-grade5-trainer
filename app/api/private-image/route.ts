import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { privateBankDir } from "@/lib/private-bank";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export function GET(request: Request) {
  const relative = new URL(request.url).searchParams.get("path") ?? "";
  if (!relative || path.isAbsolute(relative) || relative.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }
  const root = privateBankDir();
  const full = path.resolve(root, relative);
  if (full !== root && !full.startsWith(`${root}${path.sep}`)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const type = TYPES[path.extname(full).toLowerCase()];
  if (!type || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(new Uint8Array(fs.readFileSync(full)), {
    status: 200,
    headers: { "content-type": type, "cache-control": "private, max-age=3600" },
  });
}
