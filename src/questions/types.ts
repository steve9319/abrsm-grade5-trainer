import type { NotationSpec } from '../notation/types';

export type TopicId =
  | 'rhythm'
  | 'pitch'
  | 'keys'
  | 'intervals'
  | 'chords'
  | 'transposition'
  | 'terms'
  | 'instruments'
  | 'context';

export interface Choice {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  topic: TopicId;
  prompt: string;
  notation?: NotationSpec;
  choices: Choice[];
  correctId: string;
  explanation: string;
}

export const TOPICS: { id: TopicId; title: string; kicker: string; blurb: string }[] = [
  {
    id: 'rhythm',
    title: 'Rhythm',
    kicker: 'Section 1',
    blurb: 'Simple, compound and irregular metres, including 5/8 and 7/8, plus duplets, triplets, quintuplets and sextuplets.',
  },
  {
    id: 'pitch',
    title: 'Pitch and clefs',
    kicker: 'Section 2',
    blurb: 'Note names in the treble, bass, alto and tenor clefs, with enharmonics and double sharps and flats.',
  },
  {
    id: 'keys',
    title: 'Keys and scales',
    kicker: 'Section 3',
    blurb: 'Major and minor keys up to six sharps or flats, harmonic and melodic minors, technical names and chromatic spelling.',
  },
  {
    id: 'intervals',
    title: 'Intervals',
    kicker: 'Section 4',
    blurb: 'Every simple and compound interval from any note: diminished, minor, perfect, major and augmented.',
  },
  {
    id: 'chords',
    title: 'Chords and cadences',
    kicker: 'Section 5',
    blurb: 'Chords I, II, IV and V in root position and both inversions, plus perfect, plagal and imperfect cadences.',
  },
  {
    id: 'transposition',
    title: 'Transposition',
    kicker: 'Clefs and instruments',
    blurb: 'Octave moves between clefs, transposition by interval, and instruments in B♭, A and F.',
  },
  {
    id: 'terms',
    title: 'Terms and signs',
    kicker: 'Section 6',
    blurb: 'Italian, French and German terms through Grade 5, ornaments, and the signs that tell a player what to do.',
  },
  {
    id: 'instruments',
    title: 'Instruments and voices',
    kicker: 'Section 6',
    blurb: 'Families, clefs, reeds, transposing instruments, definite pitch, and the standard voices.',
  },
  {
    id: 'context',
    title: 'Music in context',
    kicker: 'Section 7',
    blurb: 'Short melodies that ask you to use the key, the metre, an interval and a likely instrument together.',
  },
];

export const MOCK_SECTIONS: { title: string; topics: TopicId[]; count: number }[] = [
  { title: 'Rhythm', topics: ['rhythm'], count: 3 },
  { title: 'Pitch and transposition', topics: ['pitch', 'transposition'], count: 3 },
  { title: 'Keys and scales', topics: ['keys'], count: 3 },
  { title: 'Intervals', topics: ['intervals'], count: 3 },
  { title: 'Chords and cadences', topics: ['chords'], count: 3 },
  { title: 'Terms, signs and instruments', topics: ['terms', 'instruments'], count: 3 },
  { title: 'Music in context', topics: ['context'], count: 3 },
];
