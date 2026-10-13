import type { Metadata } from "next";
import { StrategyGuide } from "@/components/StrategyGuide";
import { loadQuestions } from "@/lib/questions.server";

export const metadata: Metadata = { title: "Pass strategy" };

export default function StrategyPage() {
  const bank = loadQuestions().map((question) => ({
    id: question.id,
    topic: question.topic,
    subtopic: question.subtopic,
  }));
  return <StrategyGuide bank={bank} />;
}
