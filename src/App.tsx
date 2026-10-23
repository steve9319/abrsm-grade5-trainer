import { useEffect, useState } from 'react';
import { Home } from './components/Home';
import { MockTest } from './components/MockTest';
import { ProgressView } from './components/ProgressView';
import { Quiz } from './components/Quiz';
import {
  emptyLearner,
  loadStore,
  recordAnswer,
  recordMock,
  saveStore,
  type MockResult,
} from './progress';
import type { TopicId } from './questions/types';

type Screen =
  | { name: 'home' }
  | { name: 'quiz'; topic: TopicId; session: number }
  | { name: 'mock'; session: number }
  | { name: 'progress' };

export function App() {
  const [store, setStore] = useState(loadStore);
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const learner = store.learners[store.active] ?? emptyLearner();

  useEffect(() => {
    saveStore(store);
  }, [store]);

  function addLearner() {
    const name = draft.trim().slice(0, 24);
    if (!name || store.learners[name] || Object.keys(store.learners).length >= 4) return;
    setStore({
      ...store,
      active: name,
      learners: { ...store.learners, [name]: emptyLearner() },
    });
    setDraft('');
    setAdding(false);
  }

  return (
    <div className="app">
      <header className="topbar">
        <button type="button" className="brand" onClick={() => setScreen({ name: 'home' })}>
          <span>Grade 5</span>
          Theory room
        </button>
        <div className="learners">
          <label>
            Learner
            <select
              value={store.active}
              onChange={(event) => setStore({ ...store, active: event.target.value })}
            >
              {Object.keys(store.learners).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          {adding ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                addLearner();
              }}
            >
              <input
                aria-label="Learner name"
                value={draft}
                maxLength={24}
                placeholder="Name"
                onChange={(event) => setDraft(event.target.value)}
              />
              <button type="submit" className="text-button">
                Save
              </button>
            </form>
          ) : (
            <button type="button" className="text-button" onClick={() => setAdding(true)} disabled={Object.keys(store.learners).length >= 4}>
              Add learner
            </button>
          )}
        </div>
      </header>
      <main>
        {screen.name === 'home' ? (
          <Home
            learner={learner}
            onTopic={(topic) => setScreen({ name: 'quiz', topic, session: Date.now() })}
            onMock={() => setScreen({ name: 'mock', session: Date.now() })}
            onProgress={() => setScreen({ name: 'progress' })}
          />
        ) : null}
        {screen.name === 'quiz' ? (
          <Quiz
            topic={screen.topic}
            session={screen.session}
            onAnswer={(topic, correct) => setStore((current) => recordAnswer(current, topic, correct))}
            onExit={() => setScreen({ name: 'home' })}
          />
        ) : null}
        {screen.name === 'mock' ? (
          <MockTest
            session={screen.session}
            onAnswer={(topic, correct) => setStore((current) => recordAnswer(current, topic, correct))}
            onFinish={(result: MockResult) => setStore((current) => recordMock(current, result))}
            onExit={() => setScreen({ name: 'home' })}
          />
        ) : null}
        {screen.name === 'progress' ? (
          <ProgressView
            name={store.active}
            learner={learner}
            onHome={() => setScreen({ name: 'home' })}
            onClear={() =>
              setStore((current) => ({
                ...current,
                learners: { ...current.learners, [current.active]: emptyLearner() },
              }))
            }
          />
        ) : null}
      </main>
      <footer>
        Practice for the ABRSM Grade 5 Music Theory exam (syllabus from 2020, still current). Not affiliated with ABRSM.
        Progress for {store.active} is saved only in this browser.
      </footer>
    </div>
  );
}
