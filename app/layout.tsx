import type { Metadata } from "next";
import "@fontsource/fraunces/latin-500.css";
import "@fontsource/fraunces/latin-600.css";
import "@fontsource/fraunces/latin-700.css";
import "@fontsource/outfit/latin-400.css";
import "@fontsource/outfit/latin-500.css";
import "@fontsource/outfit/latin-600.css";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: {
    default: "Grade 5 Theory",
    template: "%s · Grade 5 Theory",
  },
  description:
    "Practise ABRSM Grade 5 music theory with original questions, instant explanations, and a timed mock paper for piano students.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <footer className="site-footer">
          <p>
            Unofficial study tool for the ABRSM Grade 5 Music Theory syllabus. Not affiliated with
            ABRSM. The questions shipped in this bank are original. Do not replace them, in a public
            repository, with verbatim text from exam papers.
          </p>
        </footer>
      </body>
    </html>
  );
}
