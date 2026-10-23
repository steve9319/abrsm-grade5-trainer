import { pitchName, type Accidental, type Letter, type Pitch } from './pitch';

export type Mode = 'major' | 'minor';
export type ScaleForm = 'major' | 'natural' | 'harmonic' | 'melodic-ascending' | 'melodic-descending';
export type DegreeNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface KeySpec {
  tonic: Letter;
  accidental: Accidental;
  mode: Mode;
  signature: number;
}

export const SHARP_ORDER: Letter[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
export const FLAT_ORDER: Letter[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

export const DEGREE_NAMES = [
  'tonic',
  'supertonic',
  'mediant',
  'subdominant',
  'dominant',
  'submediant',
  'leading note',
] as const;

const MAJOR_TABLE: [number, Letter, Accidental][] = [
  [0, 'C', 0],
  [1, 'G', 0],
  [2, 'D', 0],
  [3, 'A', 0],
  [4, 'E', 0],
  [5, 'B', 0],
  [6, 'F', 1],
  [-1, 'F', 0],
  [-2, 'B', -1],
  [-3, 'E', -1],
  [-4, 'A', -1],
  [-5, 'D', -1],
  [-6, 'G', -1],
];

const MINOR_TABLE: [number, Letter, Accidental][] = [
  [0, 'A', 0],
  [1, 'E', 0],
  [2, 'B', 0],
  [3, 'F', 1],
  [4, 'C', 1],
  [5, 'G', 1],
  [6, 'D', 1],
  [-1, 'D', 0],
  [-2, 'G', 0],
  [-3, 'C', 0],
  [-4, 'F', 0],
  [-5, 'B', -1],
  [-6, 'E', -1],
];

function buildKeys(table: [number, Letter, Accidental][], mode: Mode): KeySpec[] {
  return table.map(([signature, tonic, accidental]) => ({ tonic, accidental, mode, signature }));
}

export const MAJOR_KEYS: KeySpec[] = buildKeys(MAJOR_TABLE, 'major');
export const MINOR_KEYS: KeySpec[] = buildKeys(MINOR_TABLE, 'minor');
export const ALL_KEYS: KeySpec[] = [...MAJOR_KEYS, ...MINOR_KEYS];

/** Cadence writing in the Grade 5 syllabus is limited to these major keys. */
export const CADENCE_KEYS: KeySpec[] = MAJOR_KEYS.filter((key) =>
  ['C', 'G', 'D', 'F'].includes(key.tonic) && key.accidental === 0,
);

const OFFSETS: Record<ScaleForm, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  natural: [0, 2, 3, 5, 7, 8, 10],
  harmonic: [0, 2, 3, 5, 7, 8, 11],
  'melodic-ascending': [0, 2, 3, 5, 7, 9, 11],
  'melodic-descending': [0, 2, 3, 5, 7, 8, 10],
};

export function keyName(key: KeySpec): string {
  return `${pitchName({ letter: key.tonic, accidental: key.accidental, octave: 4 })} ${key.mode}`;
}

export function tonicPitch(key: KeySpec, octave = 4): Pitch {
  return { letter: key.tonic, accidental: key.accidental, octave };
}

export function vexflowKeyName(key: KeySpec): string {
  const accidental = key.accidental === 1 ? '#' : key.accidental === -1 ? 'b' : '';
  const base = `${key.tonic}${accidental}`;
  return key.mode === 'minor' ? `${base}m` : base;
}

export function accidentalForLetter(letter: Letter, signature: number): Accidental {
  if (signature > 0) {
    const index = SHARP_ORDER.indexOf(letter);
    return index > -1 && index < signature ? 1 : 0;
  }
  if (signature < 0) {
    const index = FLAT_ORDER.indexOf(letter);
    return index > -1 && index < -signature ? -1 : 0;
  }
  return 0;
}

export function signatureSummary(signature: number): string {
  if (signature === 0) return 'no sharps or flats';
  const order = signature > 0 ? SHARP_ORDER.slice(0, signature) : FLAT_ORDER.slice(0, -signature);
  const word = signature > 0 ? 'sharp' : 'flat';
  const symbol = signature > 0 ? '♯' : '♭';
  const plural = Math.abs(signature) === 1 ? '' : 's';
  return `${Math.abs(signature)} ${word}${plural} (${order.map((letter) => `${letter}${symbol}`).join(' ')})`;
}

export function scaleDegree(key: KeySpec, degree: DegreeNumber, form?: ScaleForm): Pitch {
  const resolved = form ?? (key.mode === 'major' ? 'major' : 'harmonic');
  if (key.mode === 'major' && resolved !== 'major') {
    throw new Error(`${keyName(key)} does not use the ${resolved} form`);
  }
  const offsets = OFFSETS[resolved];
  const semitones = offsets[degree - 1];
  if (semitones === undefined) throw new Error(`Bad degree ${degree}`);
  const tonic = tonicPitch(key, 4);
  const letterSteps = degree - 1;
  const sum = (['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const).indexOf(tonic.letter) + letterSteps;
  const octave = tonic.octave + Math.floor(sum / 7);
  const letter = (['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const)[((sum % 7) + 7) % 7];
  const naturalMidi = (octave + 1) * 12 + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[letter];
  const accidental = tonicPitchMidi(tonic) + semitones - naturalMidi;
  if (accidental < -2 || accidental > 2) {
    throw new Error(`Cannot spell degree ${degree} of ${keyName(key)}`);
  }
  return { letter, accidental: accidental as Accidental, octave };
}

function tonicPitchMidi(pitch: Pitch): number {
  return (pitch.octave + 1) * 12 + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[pitch.letter] + pitch.accidental;
}

export function degreeName(degree: DegreeNumber): string {
  return DEGREE_NAMES[degree - 1];
}

export function findKey(letter: Letter, accidental: Accidental, mode: Mode): KeySpec | undefined {
  return ALL_KEYS.find((key) => key.mode === mode && key.tonic === letter && key.accidental === accidental);
}

export function findKeyByPitchClass(pitch: Pitch, mode: Mode): KeySpec | undefined {
  const direct = findKey(pitch.letter, pitch.accidental, mode);
  if (direct) return direct;
  const target = tonicPitchMidi({ ...pitch, octave: 4 }) % 12;
  return ALL_KEYS.find((key) => key.mode === mode && tonicPitchMidi(tonicPitch(key)) % 12 === ((target % 12) + 12) % 12);
}

export function relativeKey(key: KeySpec): KeySpec {
  const match = ALL_KEYS.find((other) => other.mode !== key.mode && other.signature === key.signature);
  if (!match) throw new Error(`No relative key for ${keyName(key)}`);
  return match;
}
