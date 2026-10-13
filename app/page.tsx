import { HomeDashboard } from "@/components/HomeDashboard";
import { loadQuestions } from "@/lib/questions.server";

export default function Page() {
  const bank = loadQuestions().map((question) => ({
    id: question.id,
    topic: question.topic,
    subtopic: question.subtopic,
  }));
  return <HomeDashboard bank={bank} />;
}
