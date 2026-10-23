import { intervalBetween, type Interval } from './interval';
import { degreeName, scaleDegree, type DegreeNumber, type KeySpec } from './key';
import { pitchName, toMidi, type Pitch } from './pitch';

export type ChordDegree = 1 | 2 | 4 | 5;
export type Inversion = 'a' | 'b' | 'c';
export type CadenceName = 'perfect' | 'plagal' | 'imperfect';

const ROMAN: Record<ChordDegree, string> = { 1: 'I', 2: 'II', 4: 'IV', 5: 'V' };

export function chordSymbol(degree: ChordDegree, inversion: Inversion): string {
  return `${ROMAN[degree]}${inversion}`;
}

export function inversionName(inversion: Inversion): string {
  if (inversion === 'a') return 'root position (a), with the root in the bass';
  if (inversion === 'b') return 'first inversion (b), with the 3rd in the bass';
  return 'second inversion (c), with the 5th in the bass';
}

interface PitchClass {
  letter: Pitch['letter'];
  accidental: Pitch['accidental'];
}

function pitchClass(key: KeySpec, degree: DegreeNumber): PitchClass {
  const form = key.mode === 'minor' ? 'harmonic' : 'major';
  const note = scaleDegree(key, degree, form);
  return { letter: note.letter, accidental: note.accidental };
}

function atOrAbove(pitchClassNote: PitchClass, minMidi: number): Pitch {
  let octave = 2;
  let pitch: Pitch = { ...pitchClassNote, octave };
  while (toMidi(pitch) < minMidi && octave < 8) {
    octave += 1;
    pitch = { ...pitchClassNote, octave };
  }
  return pitch;
}

/** Close-position tonic, supertonic, subdominant or dominant triad. Minor keys use the harmonic form, so V is major. */
export function buildTriad(key: KeySpec, degree: ChordDegree, inversion: Inversion, bassOctave = 4): Pitch[] {
  const root = pitchClass(key, degree);
  const third = pitchClass(key, (((degree - 1 + 2) % 7) + 1) as DegreeNumber);
  const fifth = pitchClass(key, (((degree - 1 + 4) % 7) + 1) as DegreeNumber);
  const order = inversion === 'a' ? [root, third, fifth] : inversion === 'b' ? [third, fifth, root] : [fifth, root, third];
  const bass = { ...order[0], octave: bassOctave };
  const notes: Pitch[] = [bass];
  for (const next of order.slice(1)) {
    notes.push(atOrAbove(next, toMidi(notes[notes.length - 1] as Pitch) + 1));
  }
  return notes;
}

function classId(pitch: Pitch): string {
  return `${pitch.letter}:${pitch.accidental}`;
}

export function identifyTriad(key: KeySpec, notes: Pitch[]): { degree: ChordDegree; inversion: Inversion } | null {
  if (notes.length !== 3) return null;
  const bass = [...notes].sort((a, b) => toMidi(a) - toMidi(b))[0] as Pitch;
  const sounding = [...notes].map(classId).sort().join('|');
  for (const degree of [1, 2, 4, 5] as const) {
    for (const inversion of ['a', 'b', 'c'] as const) {
      const built = buildTriad(key, degree, inversion, 4);
      const builtSounding = built.map(classId).sort().join('|');
      const builtBass = [...built].sort((a, b) => toMidi(a) - toMidi(b))[0] as Pitch;
      if (builtSounding === sounding && classId(builtBass) === classId(bass)) {
        return { degree, inversion };
      }
    }
  }
  return null;
}

export function triadExplanation(key: KeySpec, degree: ChordDegree, inversion: Inversion): string {
  const form = key.mode === 'minor' ? 'harmonic' : 'major';
  const root = scaleDegree(key, degree, form);
  const notes = buildTriad(key, degree, inversion, 4);
  const minor =
    key.mode === 'minor'
      ? ' In a minor key the harmonic scale is used, which raises the leading note, so V is a major chord.'
      : '';
  return `${chordSymbol(degree, inversion)} means the ${degreeName(degree)} chord (${pitchName(root)}) in ${inversionName(inversion)}. Spelled in close position it is ${notes.map((note) => pitchName(note)).join(' ')}.${minor}`;
}

export function classifyCadence(first: ChordDegree, second: ChordDegree): CadenceName | null {
  if (first === 5 && second === 1) return 'perfect';
  if (first === 4 && second === 1) return 'plagal';
  if (second === 5 && (first === 1 || first === 2 || first === 4)) return 'imperfect';
  return null;
}

export function explainCadence(first: ChordDegree, second: ChordDegree): string {
  const name = classifyCadence(first, second);
  const pair = `${chordSymbol(first, 'a')}–${chordSymbol(second, 'a')}`;
  if (name === 'perfect') return `${pair} is a perfect cadence: the dominant resolves to the tonic, and the phrase sounds finished.`;
  if (name === 'plagal') return `${pair} is a plagal cadence: the subdominant moves to the tonic.`;
  if (name === 'imperfect') return `${pair} is an imperfect cadence: it ends on the dominant, so it sounds unfinished. Grade 5 expects perfect, plagal and imperfect cadences in C, G, D and F major.`;
  return `${pair} is not one of the Grade 5 cadences.`;
}

export function intervalStack(notes: Pitch[]): Interval[] {
  const sorted = [...notes].sort((a, b) => toMidi(a) - toMidi(b));
  return [intervalBetween(sorted[0] as Pitch, sorted[1] as Pitch), intervalBetween(sorted[0] as Pitch, sorted[2] as Pitch)];
}
