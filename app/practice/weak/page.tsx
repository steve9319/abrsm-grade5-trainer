import type { Metadata } from "next";
import { WeakSession } from "@/components/WeakSession";
import { loadQuestions } from "@/lib/questions.server";

export const metadata: Metadata = { title: "Train weak spots" };

export default function WeakPracticePage() {
  return <WeakSession questions={loadQuestions()} />;
}
