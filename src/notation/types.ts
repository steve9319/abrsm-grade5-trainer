import type { NoteValue } from '../theory/rhythm';
import type { Pitch } from '../theory/pitch';

export type ClefName = 'treble' | 'bass' | 'alto' | 'tenor';
export type ArticulationName = 'staccato' | 'accent' | 'tenuto' | 'staccatissimo' | 'marcato' | 'fermata';

export interface NotationEvent {
  kind: 'note' | 'rest';
  pitches?: Pitch[];
  value: NoteValue;
  dots?: 0 | 1 | 2;
  tuplet?: { notes: number; occupied: number; groupId: string };
  articulation?: ArticulationName;
  barlineAfter?: boolean;
}

export interface NotationSystem {
  label?: string;
  clef: ClefName;
  timeSignature?: string;
  keySignature?: string;
  /** Used so accidentals already in the signature are not printed again. */
  signatureCount?: number;
  events: NotationEvent[];
}

export interface NotationSpec {
  systems: NotationSystem[];
}

export function staff(system: NotationSystem): NotationSpec {
  return { systems: [system] };
}
