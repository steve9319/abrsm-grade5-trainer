import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { encode } from "@auth/core/jwt";
import { decideAccess, isAllowedEmail, safeCallbackPath } from "@/lib/auth-guard";

const ALLOW = "ada@example.com, grace@example.com";

process.env.AUTH_SECRET = "test-secret-test-secret-test-secret-32";
process.env.AUTH_TRUST_HOST = "true";
process.env.AUTH_GOOGLE_ID = "test-google-id";
process.env.AUTH_GOOGLE_SECRET = "test-google-secret";
process.env.ALLOWED_EMAILS = ALLOW;

type Middleware = (request: NextRequest) => Promise<Response>;

async function loadMiddleware(): Promise<{ middleware: Middleware; matcher: string }> {
  const mod = await import("@/middleware");
  return { middleware: mod.default as Middleware, matcher: mod.config.matcher[0] };
}

function matchedBy(matcher: string, pathname: string): boolean {
  return new RegExp(`^${matcher}$`).test(pathname);
}

describe("allowlist", () => {
  it("matches an address without regard to case or surrounding spaces", () => {
    assert.equal(isAllowedEmail("Ada@Example.com", ALLOW), true);
    assert.equal(isAllowedEmail("  GRACE@example.com ", ALLOW), true);
    assert.equal(isAllowedEmail("ada@example.com", "ADA@EXAMPLE.COM"), true);
    assert.equal(isAllowedEmail("other@example.com", ALLOW), false);
    assert.equal(isAllowedEmail("ada@example.com", ""), false);
    assert.equal(isAllowedEmail("ada@example.com"), true);
    assert.equal(isAllowedEmail("other@example.com"), false);
    assert.equal(isAllowedEmail(null, ALLOW), false);
    assert.equal(isAllowedEmail("  ", ALLOW), false);
  });
});

describe("middleware gate", () => {
  it("blocks unsigned requests to pages, API routes, and private images", async () => {
    const { middleware, matcher } = await loadMiddleware();
    assert.equal(matcher.includes("(?!api"), false);
    for (const pathname of ["/api/explain", "/api/lesson", "/api/private-image", "/practice/rhythm", "/"]) {
      assert.equal(matchedBy(matcher, pathname), true, pathname);
    }
    assert.equal(matchedBy(matcher, "/_next/static/chunk.js"), false);
    assert.equal(matchedBy(matcher, "/icon.svg"), false);

    const pages = ["/", "/practice/rhythm", "/practice/weak", "/practice/mixed", "/exam", "/strategy", "/progress"];
    for (const pathname of pages) {
      const response = await middleware(new NextRequest(`http://localhost:3000${pathname}`));
      assert.equal(response.status, 307, pathname);
      const location = new URL(response.headers.get("location") ?? "");
      assert.equal(location.pathname, "/signin", pathname);
      assert.equal(location.searchParams.get("callbackUrl"), pathname);
    }

    for (const pathname of ["/api/explain", "/api/lesson", "/api/private-image"]) {
      const response = await middleware(new NextRequest(`http://localhost:3000${pathname}?path=images/excerpt.png`));
      assert.equal(response.status, 401, pathname);
      assert.deepEqual(await response.json(), { error: "Unauthorized" });
    }

    for (const pathname of ["/signin", "/access-denied", "/api/auth/signin", "/api/auth/callback/google"]) {
      const response = await middleware(new NextRequest(`http://localhost:3000${pathname}`));
      assert.notEqual(response.status, 307, pathname);
      assert.notEqual(response.status, 401, pathname);
    }
  });

  it("lets an allowlisted session through and refuses a different signed-in address", async () => {
    const { middleware } = await loadMiddleware();
    const secret = process.env.AUTH_SECRET ?? "";
    const salt = "authjs.session-token";
    const allowed = await encode({ token: { email: "ADA@example.com", sub: "ada" }, secret, salt });
    const refused = await encode({ token: { email: "stranger@example.com", sub: "no" }, secret, salt });

    const withSession = (pathname: string, token: string) =>
      new NextRequest(`http://localhost:3000${pathname}`, {
        headers: { cookie: `${salt}=${token}`, "x-forwarded-proto": "http", host: "localhost:3000" },
      });

    const practice = await middleware(withSession("/practice/rhythm", allowed));
    assert.notEqual(practice.status, 307);
    assert.notEqual(practice.status, 401);

    const image = await middleware(withSession("/api/private-image?path=images/excerpt.png", allowed));
    assert.equal(image.status, 200);

    const deniedPage = await middleware(withSession("/exam", refused));
    assert.equal(deniedPage.status, 307);
    assert.equal(new URL(deniedPage.headers.get("location") ?? "").pathname, "/access-denied");

    const deniedImage = await middleware(withSession("/api/private-image", refused));
    assert.equal(deniedImage.status, 401);
  });

  it("keeps the same decisions when the guard is called directly", () => {
    assert.deepEqual(decideAccess({ pathname: "/api/private-image", signedIn: false }, ALLOW), {
      action: "unauthorized",
    });
    assert.equal(
      decideAccess({ pathname: "/", signedIn: true, email: "Grace@Example.com" }, ALLOW).action,
      "allow",
    );
    assert.equal(safeCallbackPath("https://evil.example"), "/");
    assert.equal(safeCallbackPath("/exam"), "/exam");
  });
});
