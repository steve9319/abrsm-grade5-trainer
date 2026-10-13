import type { Metadata } from "next";
import { signIn } from "@/auth";
import { SignOutButton } from "@/components/SignOutButton";

export const metadata: Metadata = { title: "Access denied" };

export default function AccessDeniedPage() {
  return (
    <div className="page">
      <div className="narrow">
        <section className="auth-panel">
          <p className="kicker">Access denied</p>
          <h1>This Google account cannot open the practice room.</h1>
          <p>Sign-in is limited to the addresses in the allowlist. Use one of those accounts.</p>
          <div className="actions">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" }, { prompt: "select_account" });
              }}
            >
              <button className="btn primary" type="submit">
                Sign in with a different Google account
              </button>
            </form>
            <SignOutButton className="btn ghost" label="Sign out" />
          </div>
        </section>
      </div>
    </div>
  );
}
