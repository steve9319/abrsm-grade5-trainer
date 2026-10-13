import { signOut } from "@/auth";

export function SignOutButton({ className = "sign-out", label = "Sign out" }: { className?: string; label?: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/signin" });
      }}
    >
      <button className={className} type="submit">
        {label}
      </button>
    </form>
  );
}
