import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAllowedEmail } from "@/lib/auth-guard";

function profileEmail(profile: unknown): string | null {
  if (!profile || typeof profile !== "object" || !("email" in profile)) return null;
  const email = profile.email;
  return typeof email === "string" ? email : null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/signin",
    error: "/access-denied",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, profile }) {
      if (profile && typeof profile === "object" && "email_verified" in profile && profile.email_verified === false) {
        return false;
      }
      return isAllowedEmail(user.email ?? profileEmail(profile));
    },
    async jwt({ token, user, profile }) {
      const email = user?.email ?? profileEmail(profile);
      if (email) token.email = email;
      return token;
    },
  },
});
