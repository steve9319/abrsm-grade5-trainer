import { HomeDashboard } from "@/components/HomeDashboard";
import { hasStoredAnswer, loadAllQuestions } from "@/lib/private-bank";

export const dynamic = "force-dynamic";

export default function Page() {
  const all = loadAllQuestions();
  const ready = all.filter(hasStoredAnswer);
  const bank = ready.map((question) => ({
    id: question.id,
    topic: question.topic,
    subtopic: question.subtopic,
    private: question.private,
  }));
  return (
    <HomeDashboard
      bank={bank}
      privateCount={ready.filter((question) => question.private).length}
      draftCount={all.filter((question) => question.private && !hasStoredAnswer(question)).length}
    />
  );
}
