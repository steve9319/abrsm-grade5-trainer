export type NoteValue =
  | 'breve'
  | 'semibreve'
  | 'minim'
  | 'crotchet'
  | 'quaver'
  | 'semiquaver'
  | 'demisemiquaver';

export type MeterKind = 'simple' | 'compound' | 'irregular';

export interface TimeSignatureInfo {
  signature: string;
  numerator: number;
  denominator: number;
  kind: MeterKind;
  beatName: string;
  beatCount: number;
  className: string;
  grouping: string;
}

/** Demisemiquaver = 1 tick, so every Grade 5 value except a dotted demisemiquaver is a whole number. */
export const VALUE_TICKS: Record<NoteValue, number> = {
  breve: 64,
  semibreve: 32,
  minim: 16,
  crotchet: 8,
  quaver: 4,
  semiquaver: 2,
  demisemiquaver: 1,
};

export const VALUE_NAMES: Record<NoteValue, { british: string; american: string }> = {
  breve: { british: 'breve', american: 'double whole note' },
  semibreve: { british: 'semibreve', american: 'whole note' },
  minim: { british: 'minim', american: 'half note' },
  crotchet: { british: 'crotchet', american: 'quarter note' },
  quaver: { british: 'quaver', american: 'eighth note' },
  semiquaver: { british: 'semiquaver', american: '16th note' },
  demisemiquaver: { british: 'demisemiquaver', american: '32nd note' },
};

export const TIME_SIGNATURES: TimeSignatureInfo[] = [
  { signature: '2/4', numerator: 2, denominator: 4, kind: 'simple', beatName: 'crotchet', beatCount: 2, className: 'simple duple', grouping: 'two crotchet beats' },
  { signature: '3/4', numerator: 3, denominator: 4, kind: 'simple', beatName: 'crotchet', beatCount: 3, className: 'simple triple', grouping: 'three crotchet beats' },
  { signature: '4/4', numerator: 4, denominator: 4, kind: 'simple', beatName: 'crotchet', beatCount: 4, className: 'simple quadruple', grouping: 'four crotchet beats, and a rest should not cross the middle of the bar' },
  { signature: '2/2', numerator: 2, denominator: 2, kind: 'simple', beatName: 'minim', beatCount: 2, className: 'simple duple', grouping: 'two minim beats' },
  { signature: '3/2', numerator: 3, denominator: 2, kind: 'simple', beatName: 'minim', beatCount: 3, className: 'simple triple', grouping: 'three minim beats' },
  { signature: '4/2', numerator: 4, denominator: 2, kind: 'simple', beatName: 'minim', beatCount: 4, className: 'simple quadruple', grouping: 'four minim beats' },
  { signature: '3/8', numerator: 3, denominator: 8, kind: 'simple', beatName: 'quaver', beatCount: 3, className: 'simple triple', grouping: 'three quaver beats' },
  { signature: '4/8', numerator: 4, denominator: 8, kind: 'simple', beatName: 'quaver', beatCount: 4, className: 'simple quadruple', grouping: 'four quaver beats' },
  { signature: '6/4', numerator: 6, denominator: 4, kind: 'compound', beatName: 'dotted minim', beatCount: 2, className: 'compound duple', grouping: 'two dotted-minim beats' },
  { signature: '9/4', numerator: 9, denominator: 4, kind: 'compound', beatName: 'dotted minim', beatCount: 3, className: 'compound triple', grouping: 'three dotted-minim beats' },
  { signature: '6/8', numerator: 6, denominator: 8, kind: 'compound', beatName: 'dotted crotchet', beatCount: 2, className: 'compound duple', grouping: 'two groups of three quavers' },
  { signature: '9/8', numerator: 9, denominator: 8, kind: 'compound', beatName: 'dotted crotchet', beatCount: 3, className: 'compound triple', grouping: 'three groups of three quavers' },
  { signature: '12/8', numerator: 12, denominator: 8, kind: 'compound', beatName: 'dotted crotchet', beatCount: 4, className: 'compound quadruple', grouping: 'four groups of three quavers' },
  { signature: '6/16', numerator: 6, denominator: 16, kind: 'compound', beatName: 'dotted quaver', beatCount: 2, className: 'compound duple', grouping: 'two groups of three semiquavers' },
  { signature: '9/16', numerator: 9, denominator: 16, kind: 'compound', beatName: 'dotted quaver', beatCount: 3, className: 'compound triple', grouping: 'three groups of three semiquavers' },
  { signature: '12/16', numerator: 12, denominator: 16, kind: 'compound', beatName: 'dotted quaver', beatCount: 4, className: 'compound quadruple', grouping: 'four groups of three semiquavers' },
  { signature: '5/4', numerator: 5, denominator: 4, kind: 'irregular', beatName: 'crotchet', beatCount: 5, className: 'irregular', grouping: '3 + 2 or 2 + 3 crotchet beats' },
  { signature: '7/4', numerator: 7, denominator: 4, kind: 'irregular', beatName: 'crotchet', beatCount: 7, className: 'irregular', grouping: '2 + 2 + 3, 2 + 3 + 2, or 3 + 2 + 2 crotchet beats' },
  { signature: '5/8', numerator: 5, denominator: 8, kind: 'irregular', beatName: 'quaver', beatCount: 5, className: 'irregular', grouping: '3 + 2 or 2 + 3 quavers' },
  { signature: '7/8', numerator: 7, denominator: 8, kind: 'irregular', beatName: 'quaver', beatCount: 7, className: 'irregular', grouping: '2 + 2 + 3, 2 + 3 + 2, or 3 + 2 + 2 quavers' },
];

export interface DurationPiece {
  value: NoteValue;
  dots: 0 | 1 | 2;
  ticks: number;
}

export const DURATION_CATALOG: DurationPiece[] = [
  { value: 'breve', dots: 0, ticks: 64 },
  { value: 'semibreve', dots: 1, ticks: 48 },
  { value: 'semibreve', dots: 0, ticks: 32 },
  { value: 'minim', dots: 2, ticks: 28 },
  { value: 'minim', dots: 1, ticks: 24 },
  { value: 'minim', dots: 0, ticks: 16 },
  { value: 'crotchet', dots: 2, ticks: 14 },
  { value: 'crotchet', dots: 1, ticks: 12 },
  { value: 'crotchet', dots: 0, ticks: 8 },
  { value: 'quaver', dots: 2, ticks: 7 },
  { value: 'quaver', dots: 1, ticks: 6 },
  { value: 'quaver', dots: 0, ticks: 4 },
  { value: 'semiquaver', dots: 1, ticks: 3 },
  { value: 'semiquaver', dots: 0, ticks: 2 },
  { value: 'demisemiquaver', dots: 0, ticks: 1 },
];

export function barTicks(signature: Pick<TimeSignatureInfo, 'numerator' | 'denominator'>): number {
  return signature.numerator * (32 / signature.denominator);
}

export function durationTicks(value: NoteValue, dots: number): number {
  const base = VALUE_TICKS[value];
  if (dots === 1) return base * 1.5;
  if (dots === 2) return base * 1.75;
  return base;
}

export function durationLabel(value: NoteValue, dots: number, rest = false): string {
  const dotted = dots === 2 ? 'double-dotted ' : dots === 1 ? 'dotted ' : '';
  return `${dotted}${value}${rest ? ' rest' : ''}`;
}

export function findDuration(ticks: number): DurationPiece | undefined {
  return DURATION_CATALOG.find((piece) => piece.ticks === ticks);
}

export interface TupletInfo {
  name: string;
  notes: number;
  occupied: number;
  written: NoteValue;
  equals: string;
  explanation: string;
}

export const TUPLETS: TupletInfo[] = [
  {
    name: 'triplet',
    notes: 3,
    occupied: 2,
    written: 'quaver',
    equals: 'crotchet',
    explanation: 'A triplet is three notes in the time of two of the same kind. Three triplet quavers last as long as two ordinary quavers, which is one crotchet.',
  },
  {
    name: 'triplet',
    notes: 3,
    occupied: 2,
    written: 'crotchet',
    equals: 'minim',
    explanation: 'A triplet is three notes in the time of two of the same kind. Three triplet crotchets last as long as one minim.',
  },
  {
    name: 'duplet',
    notes: 2,
    occupied: 3,
    written: 'quaver',
    equals: 'dotted crotchet',
    explanation: 'A duplet is two notes in the time of three of the same kind. Two duplet quavers fill one dotted-crotchet beat, the beat of 6/8.',
  },
  {
    name: 'quintuplet',
    notes: 5,
    occupied: 4,
    written: 'semiquaver',
    equals: 'crotchet',
    explanation: 'A quintuplet is five notes in the time of four of the same kind. Five quintuplet semiquavers last as long as one crotchet.',
  },
  {
    name: 'sextuplet',
    notes: 6,
    occupied: 4,
    written: 'semiquaver',
    equals: 'crotchet',
    explanation: 'A sextuplet is six notes in the time of four of the same kind. Six sextuplet semiquavers last as long as one crotchet.',
  },
];
