import type { Metadata } from "next";
import { signIn } from "@/auth";
import { safeCallbackPath } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = safeCallbackPath(params.callbackUrl);

  return (
    <div className="page">
      <div className="narrow">
        <section className="auth-panel">
          <p className="kicker">Grade 5 Theory</p>
          <h1>Sign in to practise.</h1>
          <p>
            This practice room is limited to the Google accounts listed in <code>ALLOWED_EMAILS</code>.
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo }, { prompt: "select_account" });
            }}
          >
            <button className="btn primary" type="submit">
              Sign in with Google
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
