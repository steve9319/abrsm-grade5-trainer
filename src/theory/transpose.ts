import { transposeByInterval, type Direction, type Interval, type Quality } from './interval';
import { findKeyByPitchClass, tonicPitch, type KeySpec } from './key';
import { pitchName, type Pitch } from './pitch';

export type InstrumentKey = 'Bb' | 'A' | 'F';

export interface TransposingInstrument {
  id: InstrumentKey;
  writtenName: string;
  /** Interval from the written note to the sounding (concert) note. The exam states this interval. */
  toConcert: Interval;
  examples: string;
}

export const TRANSPOSING_INSTRUMENTS: Record<InstrumentKey, TransposingInstrument> = {
  Bb: {
    id: 'Bb',
    writtenName: 'B♭',
    toConcert: { number: 2, quality: 'major', direction: 'down' },
    examples: 'clarinet in B♭, trumpet in B♭',
  },
  A: {
    id: 'A',
    writtenName: 'A',
    toConcert: { number: 3, quality: 'minor', direction: 'down' },
    examples: 'clarinet in A',
  },
  F: {
    id: 'F',
    writtenName: 'F',
    toConcert: { number: 5, quality: 'perfect', direction: 'down' },
    examples: 'horn in F, cor anglais',
  },
};

export function invertInterval(interval: Interval): Interval {
  return { ...interval, direction: interval.direction === 'up' ? 'down' : 'up' };
}

export function toConcert(written: Pitch, instrument: InstrumentKey): Pitch {
  return transposeByInterval(written, TRANSPOSING_INSTRUMENTS[instrument].toConcert);
}

export function toWritten(concert: Pitch, instrument: InstrumentKey): Pitch {
  return transposeByInterval(concert, invertInterval(TRANSPOSING_INSTRUMENTS[instrument].toConcert));
}

export function shiftOctave(pitch: Pitch, octaves: number): Pitch {
  return { ...pitch, octave: pitch.octave + octaves };
}

export function transposeKey(key: KeySpec, interval: Interval): KeySpec | undefined {
  try {
    const next = transposeByInterval(tonicPitch(key), interval);
    return findKeyByPitchClass(next, key.mode);
  } catch {
    return undefined;
  }
}

export function describeTransposition(instrument: InstrumentKey, direction: 'to-concert' | 'to-written'): string {
  const spec = TRANSPOSING_INSTRUMENTS[instrument];
  const interval = direction === 'to-concert' ? spec.toConcert : invertInterval(spec.toConcert);
  const way = interval.direction === 'down' ? 'down' : 'up';
  return `An instrument in ${spec.writtenName} (${spec.examples}) ${direction === 'to-concert' ? 'sounds' : 'is written'} a ${interval.quality} ${interval.number === 2 ? '2nd' : interval.number === 3 ? '3rd' : '5th'} ${way} from the ${direction === 'to-concert' ? 'written' : 'concert'} note.`;
}

export function intervalFromDescription(number: number, quality: Quality, direction: Direction): Interval {
  return { number, quality, direction };
}

export function pitchLabel(pitch: Pitch): string {
  return pitchName(pitch);
}
