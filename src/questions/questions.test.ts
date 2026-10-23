import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../theory/random';
import { generateQuestion } from './bank';
import { TOPICS, type TopicId } from './types';

describe('question generator', () => {
  const topics = TOPICS.map((topic) => topic.id);

  it.each(topics)('builds valid %s questions', (topic: TopicId) => {
    const rng = mulberry32(2020 + topic.length * 17);
    for (let index = 0; index < 24; index += 1) {
      const question = generateQuestion(topic, rng);
      expect(question.topic).toBe(topic);
      expect(question.prompt.length).toBeGreaterThan(8);
      expect(question.explanation.length).toBeGreaterThan(8);
      expect(question.choices).toHaveLength(4);
      expect(new Set(question.choices.map((choice) => choice.label)).size).toBe(4);
      expect(question.choices.some((choice) => choice.id === question.correctId)).toBe(true);
    }
  });
});
