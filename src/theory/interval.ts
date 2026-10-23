import { addLetterSteps, letterIndex, pitchName, toMidi, type Accidental, type Pitch } from './pitch';

export type Quality = 'diminished' | 'minor' | 'perfect' | 'major' | 'augmented';
export type Direction = 'up' | 'down';

export interface Interval {
  number: number;
  quality: Quality;
  direction: Direction;
}

const ORDINALS: Record<number, string> = {
  1: 'unison',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
  8: 'octave',
  9: '9th',
  10: '10th',
  11: '11th',
  12: '12th',
  13: '13th',
  14: '14th',
  15: '15th',
};

/** Semitone size of the major or perfect form of this interval number. */
export function standardSemitones(number: number): number {
  const octaves = Math.floor((number - 1) / 7);
  const simple = ((number - 1) % 7) + 1;
  const base: Record<number, number> = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11 };
  const size = base[simple];
  if (size === undefined) throw new Error(`Unsupported interval number ${number}`);
  return octaves * 12 + size;
}

export function isPerfectType(number: number): boolean {
  const simple = ((number - 1) % 7) + 1;
  return simple === 1 || simple === 4 || simple === 5;
}

export function semitonesOf(interval: Interval): number {
  const standard = standardSemitones(interval.number);
  const delta = isPerfectType(interval.number)
    ? { diminished: -1, perfect: 0, augmented: 1 }
    : { diminished: -2, minor: -1, major: 0, augmented: 1 };
  const shift = (delta as Record<string, number | undefined>)[interval.quality];
  if (shift === undefined) {
    throw new Error(`A ${interval.quality} ${interval.number} is not a real interval`);
  }
  return standard + shift;
}

export function qualityFromSemitones(number: number, semitones: number): Quality {
  const delta = semitones - standardSemitones(number);
  if (isPerfectType(number)) {
    if (delta === 0) return 'perfect';
    if (delta === 1) return 'augmented';
    if (delta === -1) return 'diminished';
  } else {
    if (delta === 0) return 'major';
    if (delta === -1) return 'minor';
    if (delta === -2) return 'diminished';
    if (delta === 1) return 'augmented';
  }
  throw new Error(`Cannot name ${semitones} semitones as interval ${number}`);
}

export function intervalBetween(from: Pitch, to: Pitch): Interval {
  const semitones = toMidi(to) - toMidi(from);
  const letterSteps = letterIndex(to.letter) - letterIndex(from.letter) + (to.octave - from.octave) * 7;
  const direction: Direction = letterSteps < 0 || (letterSteps === 0 && semitones < 0) ? 'down' : 'up';
  const number = Math.abs(letterSteps) + 1;
  const quality = qualityFromSemitones(number, Math.abs(semitones));
  return { number, quality, direction };
}

export function transposeByInterval(pitch: Pitch, interval: Interval): Pitch {
  const signedSteps = interval.direction === 'down' ? -(interval.number - 1) : interval.number - 1;
  const moved = addLetterSteps(pitch, signedSteps);
  const natural: Pitch = { letter: moved.letter, accidental: 0, octave: moved.octave };
  const target = interval.direction === 'down' ? -semitonesOf(interval) : semitonesOf(interval);
  const accidental = target - (toMidi(natural) - toMidi(pitch));
  if (!Number.isInteger(accidental) || accidental < -2 || accidental > 2) {
    throw new Error(`Transposing ${pitchName(pitch, true)} by ${intervalLabel(interval)} needs accidental ${accidental}`);
  }
  return { letter: moved.letter, accidental: accidental as Accidental, octave: moved.octave };
}

export function intervalLabel(interval: Pick<Interval, 'number' | 'quality'>): string {
  const name = ORDINALS[interval.number] ?? `${interval.number}th`;
  return `${interval.quality} ${name}`;
}

/** ABRSM also accepts "compound major 3rd" for a major 10th, and "compound octave" for a 15th. */
export function compoundAlias(number: number): string | null {
  if (number <= 8) return null;
  let reduced = number - 7;
  while (reduced > 8) reduced -= 7;
  const name = ORDINALS[reduced] ?? `${reduced}th`;
  return `compound ${name}`;
}

export function intervalLabelWithAlias(interval: Pick<Interval, 'number' | 'quality'>): string {
  const alias = compoundAlias(interval.number);
  const label = intervalLabel(interval);
  return alias ? `${label} (${interval.quality} ${alias})` : label;
}

export function explainInterval(lower: Pitch, upper: Pitch): string {
  const rising = toMidi(upper) >= toMidi(lower);
  const bottom = rising ? lower : upper;
  const top = rising ? upper : lower;
  const named = intervalBetween(bottom, top);
  const alias = compoundAlias(named.number);
  const aliasText = alias ? ` ABRSM also calls this a ${named.quality} ${alias}.` : '';
  return `${pitchName(bottom)} up to ${pitchName(top)} is a ${intervalLabel(named)}: count the letters for the number, then compare the semitones with the major or perfect form.${aliasText}`;
}
