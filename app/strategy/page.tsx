import type { Metadata } from "next";
import { StrategyGuide } from "@/components/StrategyGuide";
import { hasStoredAnswer, loadAllQuestions } from "@/lib/private-bank";

export const metadata: Metadata = { title: "Pass strategy" };
export const dynamic = "force-dynamic";

export default function StrategyPage() {
  const bank = loadAllQuestions()
    .filter(hasStoredAnswer)
    .map((question) => ({
      id: question.id,
      topic: question.topic,
      subtopic: question.subtopic,
      private: question.private,
    }));
  return <StrategyGuide bank={bank} />;
}
