import { percent, type Learner } from '../progress';
import { TOPICS, type TopicId } from '../questions/types';

interface Props {
  learner: Learner;
  onTopic: (topic: TopicId) => void;
  onMock: () => void;
  onProgress: () => void;
}

export function Home({ learner, onTopic, onMock, onProgress }: Props) {
  const totals = TOPICS.reduce(
    (sum, topic) => {
      const stats = learner.topics[topic.id];
      return { attempted: sum.attempted + stats.attempted, correct: sum.correct + stats.correct };
    },
    { attempted: 0, correct: 0 },
  );

  return (
    <>
      <section className="hero">
        <p className="kicker">ABRSM Grade 5 · online theory</p>
        <h1>Theory room</h1>
        <p>
          A practice desk for the current Grade 5 syllabus: rhythm through to music in context, with notation you can
          play and an explanation as soon as you answer. Nothing is stored on a server. Progress stays in this browser,
          so a second learner can keep a separate score.
        </p>
        <div className="row">
          <button type="button" className="primary" onClick={onMock}>
            Mixed mock
          </button>
          <button type="button" className="secondary" onClick={onProgress}>
            Progress{totals.attempted > 0 ? ` · ${percent(totals.correct, totals.attempted)}%` : ''}
          </button>
        </div>
      </section>
      <div className="topic-grid">
        {TOPICS.map((topic) => {
          const stats = learner.topics[topic.id];
          const score = stats.attempted > 0 ? `${percent(stats.correct, stats.attempted)}%` : 'New';
          return (
            <button key={topic.id} type="button" className="topic-card" onClick={() => onTopic(topic.id)}>
              <span className="kicker">{topic.kicker}</span>
              <span className="topic-title">{topic.title}</span>
              <span className="topic-blurb">{topic.blurb}</span>
              <span className="topic-score">{score}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
