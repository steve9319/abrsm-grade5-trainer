import type { Metadata } from "next";
import { WeakSession } from "@/components/WeakSession";
import { hasStoredAnswer, loadAllQuestions } from "@/lib/private-bank";

export const metadata: Metadata = { title: "Train weak spots" };
export const dynamic = "force-dynamic";

export default function WeakPracticePage() {
  return <WeakSession questions={loadAllQuestions().filter(hasStoredAnswer)} />;
}
