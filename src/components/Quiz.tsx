import { useMemo, useState } from 'react';
import { generateQuestion } from '../questions/bank';
import { TOPICS, type TopicId } from '../questions/types';
import { makeRng } from '../theory/random';
import { QuestionCard } from './QuestionCard';

const ROUND = 8;

interface Props {
  topic: TopicId;
  session: number;
  onAnswer: (topic: TopicId, correct: boolean) => void;
  onExit: () => void;
}

export function Quiz({ topic, session, onAnswer, onExit }: Props) {
  const info = TOPICS.find((item) => item.id === topic) ?? TOPICS[0];
  const questions = useMemo(() => {
    const rng = makeRng((session + 1) * 10007 + topic.length * 97);
    return Array.from({ length: ROUND }, () => generateQuestion(topic, rng));
  }, [session, topic]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = questions[index];

  if (!info || !question) return null;

  if (finished) {
    return (
      <section className="panel">
        <p className="kicker">{info.title}</p>
        <h2>
          {correctCount} of {ROUND}
        </h2>
        <p className="lede">
          {correctCount === ROUND
            ? 'A clean round. The explanations are worth a second look when a question felt lucky.'
            : 'The ones you missed are the useful ones. Start another round when you are ready.'}
        </p>
        <div className="row">
          <button type="button" className="primary" onClick={onExit}>
            Back to topics
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="row spread">
        <p className="kicker">{info.title}</p>
        <button type="button" className="text-button" onClick={onExit}>
          Exit
        </button>
      </div>
      <QuestionCard
        key={question.id}
        question={question}
        index={index}
        total={ROUND}
        kicker={`${correctCount} correct so far`}
        nextLabel={index === ROUND - 1 ? 'See the round' : 'Next question'}
        onAnswered={(correct) => {
          setCorrectCount((count) => count + (correct ? 1 : 0));
          onAnswer(topic, correct);
        }}
        onNext={() => {
          if (index === ROUND - 1) setFinished(true);
          else setIndex((value) => value + 1);
        }}
      />
    </section>
  );
}
