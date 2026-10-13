import type { Metadata } from "next";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { loadQuestions } from "@/lib/questions.server";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  const bank = loadQuestions().map((question) => ({
    id: question.id,
    topic: question.topic,
    subtopic: question.subtopic,
  }));
  return <ProgressDashboard bank={bank} />;
}
