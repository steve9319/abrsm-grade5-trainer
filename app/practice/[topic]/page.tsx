import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeSession } from "@/components/PracticeSession";
import { loadQuestions } from "@/lib/questions.server";
import { isTopicId, topicMeta } from "@/lib/topics";
import { TOPIC_IDS } from "@/lib/types";

export function generateStaticParams() {
  return [...TOPIC_IDS.map((topic) => ({ topic })), { topic: "mixed" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  if (topic === "mixed") return { title: "Mixed practice" };
  return { title: topicMeta(topic)?.title ?? "Practice" };
}

export default async function PracticeTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  if (topic !== "mixed" && !isTopicId(topic)) notFound();
  const all = loadQuestions();
  const questions = topic === "mixed" ? all : all.filter((question) => question.topic === topic);
  const meta =
    topic === "mixed"
      ? {
          title: "Mixed practice",
          blurb: "Every question in the bank, theory first and the piano practical set at the end.",
          syllabus: "Work in order, or pick a single topic from the home page when you want a shorter round.",
        }
      : topicMeta(topic)!;

  return (
    <PracticeSession
      questions={questions}
      title={meta.title}
      blurb={meta.blurb}
      syllabus={meta.syllabus}
    />
  );
}
