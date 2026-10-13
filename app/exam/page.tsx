import type { Metadata } from "next";
import { ExamSession } from "@/components/ExamSession";
import { hasStoredAnswer, loadAllQuestions } from "@/lib/private-bank";

export const metadata: Metadata = { title: "Mock paper" };
export const dynamic = "force-dynamic";

export default function ExamPage() {
  return <ExamSession questions={loadAllQuestions().filter(hasStoredAnswer)} />;
}
