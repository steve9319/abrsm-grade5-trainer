export type GuardDecision =
  | { action: "allow" }
  | { action: "unauthorized" }
  | { action: "redirect"; pathname: "/signin" | "/access-denied" | "/"; callbackPath?: string };

const PUBLIC_PAGES = new Set(["/signin", "/access-denied"]);

export function parseAllowlist(allowlist: string | undefined): string[] {
  return (allowlist ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

/** True only when the address is on the comma-separated allowlist. Matching ignores case and surrounding spaces. */
export function isAllowedEmail(email: string | null | undefined, allowlist = process.env.ALLOWED_EMAILS): boolean {
  if (!email?.trim()) return false;
  return parseAllowlist(allowlist).includes(email.trim().toLowerCase());
}

export function safeCallbackPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  if (value.startsWith("/signin") || value.startsWith("/access-denied") || value.startsWith("/api/")) return "/";
  return value;
}

function isAuthApi(pathname: string): boolean {
  return pathname === "/api/auth" || pathname.startsWith("/api/auth/");
}

function isApi(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg"
  );
}

/**
 * Gate for middleware. Auth.js routes and the sign-in / access-denied pages stay open.
 * Every other page redirects. Every other /api route, including private images, is rejected.
 */
export function decideAccess(
  input: { pathname: string; signedIn: boolean; email?: string | null },
  allowlist = process.env.ALLOWED_EMAILS,
): GuardDecision {
  const { pathname } = input;
  if (isStaticAsset(pathname) || isAuthApi(pathname)) return { action: "allow" };

  const allowed = input.signedIn && isAllowedEmail(input.email, allowlist);
  if (allowed) {
    if (pathname === "/signin") return { action: "redirect", pathname: "/" };
    return { action: "allow" };
  }

  if (PUBLIC_PAGES.has(pathname)) return { action: "allow" };
  if (input.signedIn) {
    if (isApi(pathname)) return { action: "unauthorized" };
    return { action: "redirect", pathname: "/access-denied" };
  }
  if (isApi(pathname)) return { action: "unauthorized" };
  return { action: "redirect", pathname: "/signin", callbackPath: pathname };
}
