import { useState } from 'react';
import { percent, type Learner } from '../progress';
import { TOPICS } from '../questions/types';

interface Props {
  name: string;
  learner: Learner;
  onClear: () => void;
  onHome: () => void;
}

export function ProgressView({ name, learner, onClear, onHome }: Props) {
  const [armed, setArmed] = useState(false);
  const totals = TOPICS.reduce(
    (sum, topic) => ({
      attempted: sum.attempted + learner.topics[topic.id].attempted,
      correct: sum.correct + learner.topics[topic.id].correct,
    }),
    { attempted: 0, correct: 0 },
  );

  return (
    <section className="panel wide">
      <p className="kicker">Progress · {name}</p>
      <h2>{totals.attempted === 0 ? 'No answers yet' : `${percent(totals.correct, totals.attempted)}% overall`}</h2>
      <p className="lede">
        {totals.attempted === 0
          ? 'Accuracy appears here after the first answered question. Mock results are listed underneath.'
          : `${totals.correct} correct from ${totals.attempted} answered questions on this device.`}
      </p>
      <ul className="progress-list">
        {TOPICS.map((topic) => {
          const stats = learner.topics[topic.id];
          const value = percent(stats.correct, stats.attempted);
          return (
            <li key={topic.id}>
              <div className="progress-label">
                <span>{topic.title}</span>
                <strong>{stats.attempted === 0 ? '—' : `${value}%`}</strong>
              </div>
              <div className="track" aria-hidden="true">
                <span style={{ width: `${stats.attempted === 0 ? 0 : value}%` }} />
              </div>
              <small>
                {stats.correct}/{stats.attempted || 0}
              </small>
            </li>
          );
        })}
      </ul>
      {learner.mocks.length > 0 ? (
        <>
          <h3>Recent mocks</h3>
          <ul className="mock-list">
            {learner.mocks.map((mock) => (
              <li key={mock.at}>
                <span>{new Date(mock.at).toLocaleString()}</span>
                <strong>
                  {mock.correct}/{mock.total} · {mock.band}
                </strong>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <div className="row">
        <button type="button" className="secondary" onClick={onHome}>
          Back to topics
        </button>
        {armed ? (
          <button
            type="button"
            className="danger"
            onClick={() => {
              setArmed(false);
              onClear();
            }}
          >
            Confirm clear
          </button>
        ) : (
          <button type="button" className="text-button" onClick={() => setArmed(true)} disabled={totals.attempted === 0 && learner.mocks.length === 0}>
            Clear {name}
          </button>
        )}
      </div>
    </section>
  );
}
