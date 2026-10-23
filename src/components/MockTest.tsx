import { useMemo, useState } from 'react';
import { examBand, type MockResult, type SectionScore } from '../progress';
import { generateQuestion } from '../questions/bank';
import { MOCK_SECTIONS, type TopicId } from '../questions/types';
import { makeRng, type Rng } from '../theory/random';
import { QuestionCard } from './QuestionCard';

interface Item {
  section: string;
  topic: TopicId;
  question: ReturnType<typeof generateQuestion>;
}

function buildPaper(rng: Rng): Item[] {
  const items: Item[] = [];
  for (const section of MOCK_SECTIONS) {
    for (let index = 0; index < section.count; index += 1) {
      const topic = section.topics[Math.floor(rng() * section.topics.length)] as TopicId;
      items.push({ section: section.title, topic, question: generateQuestion(topic, rng) });
    }
  }
  return items;
}

interface Props {
  session: number;
  onAnswer: (topic: TopicId, correct: boolean) => void;
  onFinish: (result: MockResult) => void;
  onExit: () => void;
}

export function MockTest({ session, onAnswer, onFinish, onExit }: Props) {
  const paper = useMemo(() => buildPaper(makeRng(session * 7919 + 5)), [session]);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [marks, setMarks] = useState<{ section: string; correct: boolean }[]>([]);
  const [result, setResult] = useState<MockResult | null>(null);
  const current = paper[index];

  if (!started) {
    return (
      <section className="panel">
        <p className="kicker">Mock test</p>
        <h2>Seven sections, {paper.length} questions</h2>
        <p className="lede">
          The real Grade 5 paper is two hours and 75 marks, in this order: rhythm, pitch and transposition, keys and
          scales, intervals, chords, terms and instruments, then music in context. This drill is shorter and not timed.
          Pass, merit and distinction use the same percentages as the exam: 50, 60 and 65 out of 75.
        </p>
        <div className="row">
          <button type="button" className="primary" onClick={() => setStarted(true)}>
            Start the mock
          </button>
          <button type="button" className="secondary" onClick={onExit}>
            Back
          </button>
        </div>
      </section>
    );
  }

  if (result) {
    return (
      <section className="panel">
        <p className="kicker">Result</p>
        <h2>
          {result.correct} / {result.total}
        </h2>
        <p className="band">{result.band}</p>
        <ul className="section-scores">
          {result.sections.map((section) => (
            <li key={section.title}>
              <span>{section.title}</span>
              <strong>
                {section.correct}/{section.total}
              </strong>
            </li>
          ))}
        </ul>
        <div className="row">
          <button type="button" className="primary" onClick={onExit}>
            Done
          </button>
        </div>
      </section>
    );
  }

  if (!current) return null;

  return (
    <section>
      <div className="row spread">
        <p className="kicker">{current.section}</p>
        <button type="button" className="text-button" onClick={onExit}>
          Leave mock
        </button>
      </div>
      <QuestionCard
        key={current.question.id}
        question={current.question}
        index={index}
        total={paper.length}
        kicker={`Section ${MOCK_SECTIONS.findIndex((section) => section.title === current.section) + 1} of 7`}
        nextLabel={index === paper.length - 1 ? 'See the result' : 'Next'}
        onAnswered={(correct) => {
          onAnswer(current.topic, correct);
          setMarks((previous) => [...previous, { section: current.section, correct }]);
        }}
        onNext={() => {
          if (index < paper.length - 1) {
            setIndex((value) => value + 1);
            return;
          }
          const withLast = marks;
          const sections: SectionScore[] = MOCK_SECTIONS.map((section) => {
            const rows = withLast.filter((item) => item.section === section.title);
            return {
              title: section.title,
              total: rows.length,
              correct: rows.filter((item) => item.correct).length,
            };
          });
          const correct = sections.reduce((sum, section) => sum + section.correct, 0);
          const total = sections.reduce((sum, section) => sum + section.total, 0);
          const finished: MockResult = {
            at: new Date().toISOString(),
            correct,
            total,
            band: examBand(correct, total),
            sections,
          };
          setResult(finished);
          onFinish(finished);
        }}
      />
    </section>
  );
}
