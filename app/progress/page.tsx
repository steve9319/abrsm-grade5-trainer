import type { Metadata } from "next";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { hasStoredAnswer, loadAllQuestions } from "@/lib/private-bank";

export const metadata: Metadata = { title: "Progress" };
export const dynamic = "force-dynamic";

export default function ProgressPage() {
  const bank = loadAllQuestions()
    .filter(hasStoredAnswer)
    .map((question) => ({
      id: question.id,
      topic: question.topic,
      subtopic: question.subtopic,
      private: question.private,
    }));
  return <ProgressDashboard bank={bank} />;
}
