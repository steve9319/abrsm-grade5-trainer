import { useEffect, useRef, useState } from 'react';
import { playPitches } from '../audio';
import { Notation, notationDescription } from '../notation/Staff';
import { playbackFrom } from '../questions/bank';
import type { Question } from '../questions/types';

interface Props {
  question: Question;
  index: number;
  total: number;
  kicker: string;
  onAnswered: (correct: boolean) => void;
  onNext: () => void;
  nextLabel: string;
}

export function QuestionCard({ question, index, total, kicker, onAnswered, onNext, nextLabel }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const playback = question.notation ? playbackFrom(question.notation) : [];
  const locked = useRef(false);

  useEffect(() => {
    locked.current = false;
    setSelected(null);
  }, [question.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (!answered && ['1', '2', '3', '4'].includes(event.key)) {
        const choice = question.choices[Number(event.key) - 1];
        if (choice) choose(choice.id);
      }
      if (answered && event.key === 'Enter') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function choose(id: string) {
    if (locked.current) return;
    locked.current = true;
    setSelected(id);
    onAnswered(id === question.correctId);
  }

  return (
    <article className="question">
      <div className="question-meta">
        <span>{kicker}</span>
        <span>
          {index + 1} of {total}
        </span>
      </div>
      <h2>{question.prompt}</h2>
      {question.notation ? (
        <div className="notation-card">
          <Notation spec={question.notation} />
          <p className="sr-only">{notationDescription(question.notation)}</p>
          {playback.length > 0 ? (
            <button type="button" className="text-button" onClick={() => playPitches(playback)}>
              Play
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="choices" role="group" aria-label="Answers">
        {question.choices.map((choice, choiceIndex) => {
          const isCorrect = choice.id === question.correctId;
          const isSelected = choice.id === selected;
          const state = !answered ? '' : isCorrect ? 'correct' : isSelected ? 'wrong' : 'dim';
          return (
            <button
              key={choice.id}
              type="button"
              className={`choice ${state}`}
              onClick={() => choose(choice.id)}
              disabled={answered}
            >
              <span className="choice-key">{choiceIndex + 1}</span>
              <span>{choice.label}</span>
            </button>
          );
        })}
      </div>
      {answered ? (
        <div className={selected === question.correctId ? 'feedback good' : 'feedback bad'} role="status">
          <strong>{selected === question.correctId ? 'Correct' : 'Not quite'}</strong>
          <p>{question.explanation}</p>
          <button type="button" className="primary" onClick={onNext}>
            {nextLabel}
          </button>
        </div>
      ) : (
        <p className="hint">Choose an answer. Keys 1–4 work on a keyboard.</p>
      )}
    </article>
  );
}
