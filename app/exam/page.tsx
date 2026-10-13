import type { Metadata } from "next";
import { ExamSession } from "@/components/ExamSession";
import { loadQuestions } from "@/lib/questions.server";

export const metadata: Metadata = { title: "Mock paper" };

export default function ExamPage() {
  return <ExamSession questions={loadQuestions()} />;
}
