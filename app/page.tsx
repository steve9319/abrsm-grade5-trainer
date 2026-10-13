import { HomeDashboard } from "@/components/HomeDashboard";
import { examQuestionCount } from "@/lib/exam";
import { hasStoredAnswer, loadAllQuestions } from "@/lib/private-bank";

export const dynamic = "force-dynamic";

export default function Page() {
  const all = loadAllQuestions();
  const ready = all.filter(hasStoredAnswer);
  const bank = all.map((question) => ({
    id: question.id,
    topic: question.topic,
    subtopic: question.subtopic,
    private: question.private,
  }));
  return <HomeDashboard bank={bank} draftCount={all.length - ready.length} examCount={examQuestionCount(ready)} />;
}
