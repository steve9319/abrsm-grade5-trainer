"use client";

import { Staff } from "@/components/Staff";
import { cn } from "@/lib/cn";
import { EXPLANATION_UNAVAILABLE_TEXT } from "@/lib/copy";
import type { ExplanationCacheEntry, Question } from "@/lib/types";

function resolveText(
  written: string,
  generated: string | undefined,
  generating: boolean,
  unavailable: boolean,
): string {
  if (written.trim()) return written.trim();
  if (generated?.trim()) return generated.trim();
  if (generating) return "Fetching an explanation…";
  if (unavailable) return EXPLANATION_UNAVAILABLE_TEXT;
  return EXPLANATION_UNAVAILABLE_TEXT;
}

export function QuestionView({
  question,
  selected,
  locked,
  onSelect,
  generated,
  generating,
  unavailable,
}: {
  question: Question;
  selected: string | null;
  locked: boolean;
  onSelect: (id: string) => void;
  generated: ExplanationCacheEntry | null;
  generating: boolean;
  unavailable: boolean;
}) {
  const correct = question.options.find((option) => option.id === question.correctAnswer);
  const chosen = question.options.find((option) => option.id === selected);
  const isCorrect = selected === question.correctAnswer;
  const usedGenerated = Boolean(generated) && (!question.explanation.trim() || question.options.some((option) => !option.explanation.trim()));
  const why = resolveText(question.explanation, generated?.explanation, generating, unavailable);

  const unanswered = !question.correctAnswer.trim();

  return (
    <article className="question" id="question">
      {question.private ? (
        <p className="kicker">
          My papers
          {question.questionNumber ? ` · ${question.questionNumber}` : ""}
          {question.year ? ` · ${question.year}` : ""}
          {question.paper ? ` ${question.paper}` : ""}
          {question.marks ? ` · ${question.marks} marks` : ""}
        </p>
      ) : null}
      {question.notation ? <Staff notation={question.notation} label={question.notationAlt} /> : null}
      {question.imagePath ? (
        <img
          className="score-excerpt"
          src={`/api/private-image?path=${encodeURIComponent(question.imagePath)}`}
          alt={question.notationAlt || "Score excerpt"}
        />
      ) : null}
      <p className="stem">{question.question}</p>
      <div className="options" role="group" aria-label="Answer choices">
        {question.options.map((option) => {
          const pressed = selected === option.id;
          const showCorrect = locked && !unanswered && option.id === question.correctAnswer;
          const showWrong = locked && !unanswered && pressed && option.id !== question.correctAnswer;
          return (
            <button
              key={option.id}
              type="button"
              className={cn("option", showCorrect && "correct", showWrong && "wrong")}
              aria-pressed={pressed}
              disabled={locked}
              onClick={() => onSelect(option.id)}
            >
              <span className="option-key">{option.id}</span>
              <span>{option.text}</span>
            </button>
          );
        })}
      </div>
      {locked ? (
        <section className={cn("feedback", !unanswered && !isCorrect && "miss")} id="feedback" aria-live="polite">
          <p className="kicker">{unanswered ? "No stored answer" : isCorrect ? "Correct" : "Not quite"}</p>
          <h2>
            {unanswered
              ? "This question does not have an answer yet."
              : isCorrect
                ? `${correct?.id}. ${correct?.text}`
                : `The answer is ${correct?.id}. ${correct?.text}`}
          </h2>
          {!isCorrect && chosen ? (
            <p className="muted">You chose {chosen.id}. {chosen.text}</p>
          ) : null}
          {question.answerCheck && !question.answerCheck.agreed ? (
            <p className="disagreement">{question.answerCheck.note}</p>
          ) : null}
          {question.privateAnswer?.studentDisagrees ? (
            <p className="disagreement">{question.privateAnswer.note}</p>
          ) : null}
          {usedGenerated ? <p className="generated-note">Generated explanation</p> : null}
          <h3>Why</h3>
          <p>{why}</p>
          <h3>Why the others are wrong</h3>
          <ul className="why-list">
            {question.options
              .filter((option) => option.id !== question.correctAnswer)
              .map((option) => (
                <li key={option.id}>
                  <strong>
                    {option.id}. {option.text}.
                  </strong>{" "}
                  {resolveText(option.explanation, generated?.optionExplanations[option.id], generating, unavailable)}
                </li>
              ))}
          </ul>
          <p className="source-line">Source: {question.source}</p>
        </section>
      ) : null}
    </article>
  );
}
