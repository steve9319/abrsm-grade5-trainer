import { auth } from "@/auth";
import { decideAccess } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export default auth((req) => {
  const decision = decideAccess({
    pathname: req.nextUrl.pathname,
    signedIn: Boolean(req.auth?.user),
    email: req.auth?.user?.email,
  });
  if (decision.action === "allow") return NextResponse.next();
  if (decision.action === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = decision.pathname;
  url.search = "";
  if (decision.callbackPath) url.searchParams.set("callbackUrl", decision.callbackPath);
  return NextResponse.redirect(url);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
