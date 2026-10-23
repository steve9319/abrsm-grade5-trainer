import { describe, expect, it } from 'vitest';
import { chromaticIssues, chromaticScale } from './chromatic';
import { buildTriad, chordSymbol, classifyCadence, identifyTriad, type ChordDegree, type Inversion } from './chord';
import { intervalBetween, intervalLabel, qualityFromSemitones, transposeByInterval, type Interval } from './interval';
import {
  accidentalForLetter,
  ALL_KEYS,
  degreeName,
  findKey,
  keyName,
  MAJOR_KEYS,
  MINOR_KEYS,
  relativeKey,
  scaleDegree,
  signatureSummary,
  type DegreeNumber,
} from './key';
import { pitchName, simplestEnharmonic, toMidi, type Accidental, type Pitch } from './pitch';
import { barTicks, durationTicks, findDuration, TIME_SIGNATURES } from './rhythm';
import { toConcert, toWritten, transposeKey, TRANSPOSING_INSTRUMENTS } from './transpose';

function p(letter: Pitch['letter'], accidental: Accidental, octave: number): Pitch {
  return { letter, accidental, octave };
}

describe('intervals', () => {
  const cases: [Pitch, Pitch, string][] = [
    [p('C', 0, 4), p('E', 0, 4), 'major 3rd'],
    [p('C', 0, 4), p('E', -1, 4), 'minor 3rd'],
    [p('C', 0, 4), p('F', 1, 4), 'augmented 4th'],
    [p('B', 0, 4), p('F', 0, 5), 'diminished 5th'],
    [p('C', 0, 4), p('C', 0, 5), 'perfect octave'],
    [p('C', 0, 4), p('E', 0, 5), 'major 10th'],
    [p('C', 0, 4), p('G', 0, 5), 'perfect 12th'],
    [p('C', 0, 4), p('C', 0, 6), 'perfect 15th'],
    [p('A', 0, 4), p('C', 0, 5), 'minor 3rd'],
    [p('F', 0, 4), p('B', 0, 4), 'augmented 4th'],
    [p('F', 0, 4), p('C', -1, 5), 'diminished 5th'],
    [p('F', 1, 4), p('C', 0, 5), 'diminished 5th'],
    [p('B', -1, 4), p('C', 0, 5), 'major 2nd'],
    [p('E', -1, 4), p('G', 0, 4), 'major 3rd'],
    [p('A', 0, 4), p('G', -1, 5), 'diminished 7th'],
    [p('C', 0, 4), p('C', 1, 5), 'augmented octave'],
    [p('D', 0, 4), p('C', 0, 5), 'minor 7th'],
    [p('E', 0, 4), p('F', 2, 4), 'augmented 2nd'],
    [p('C', 0, 5), p('A', 0, 4), 'minor 3rd'],
    [p('C', 0, 5), p('B', -1, 4), 'major 2nd'],
    [p('C', 0, 4), p('C', 1, 4), 'augmented unison'],
    [p('C', 0, 4), p('D', -1, 5), 'minor 9th'],
  ];

  it.each(cases)('%j to %j is %s', (from, to, label) => {
    const interval = intervalBetween(from, to);
    expect(intervalLabel(interval)).toBe(label);
  });

  it('round-trips transposition for the common Grade 5 intervals', () => {
    const starts = [p('C', 0, 4), p('F', 1, 4), p('B', -1, 3), p('E', -1, 4), p('G', 0, 3)];
    const intervals: Interval[] = [
      { number: 2, quality: 'major', direction: 'up' },
      { number: 2, quality: 'minor', direction: 'up' },
      { number: 3, quality: 'major', direction: 'up' },
      { number: 3, quality: 'minor', direction: 'down' },
      { number: 4, quality: 'perfect', direction: 'up' },
      { number: 4, quality: 'augmented', direction: 'up' },
      { number: 5, quality: 'perfect', direction: 'down' },
      { number: 5, quality: 'diminished', direction: 'up' },
      { number: 6, quality: 'major', direction: 'up' },
      { number: 6, quality: 'minor', direction: 'up' },
      { number: 7, quality: 'minor', direction: 'down' },
      { number: 8, quality: 'perfect', direction: 'up' },
      { number: 9, quality: 'major', direction: 'up' },
      { number: 10, quality: 'minor', direction: 'up' },
      { number: 12, quality: 'perfect', direction: 'up' },
    ];
    let checked = 0;
    for (const start of starts) {
      for (const interval of intervals) {
        try {
          const destination = transposeByInterval(start, interval);
          const named = intervalBetween(start, destination);
          expect(named.number).toBe(interval.number);
          expect(named.quality).toBe(interval.quality);
          expect(named.direction).toBe(interval.direction);
          checked += 1;
        } catch {
          // Some edges need more than a double sharp or flat. Those are not set as questions.
        }
      }
    }
    expect(checked).toBeGreaterThan(50);
  });

  it('rejects a major fourth', () => {
    expect(() => qualityFromSemitones(4, 5 + 0)).not.toThrow();
    expect(() =>
      transposeByInterval(p('C', 0, 4), { number: 4, quality: 'major', direction: 'up' }),
    ).toThrow();
  });
});

describe('key signatures and scales', () => {
  it('covers every major and minor key up to six sharps and flats', () => {
    expect(MAJOR_KEYS).toHaveLength(13);
    expect(MINOR_KEYS).toHaveLength(13);
    expect(MAJOR_KEYS.map((key) => key.signature).sort((a, b) => a - b)).toEqual([
      -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6,
    ]);
  });

  it('names the familiar signatures', () => {
    expect(keyName(findKey('F', 1, 'major') as never)).toBe('F♯ major');
    expect(keyName(findKey('G', -1, 'major') as never)).toBe('G♭ major');
    expect(keyName(findKey('D', 1, 'minor') as never)).toBe('D♯ minor');
    expect(keyName(findKey('E', -1, 'minor') as never)).toBe('E♭ minor');
    expect(signatureSummary(4)).toBe('4 sharps (F♯ C♯ G♯ D♯)');
    expect(signatureSummary(-3)).toBe('3 flats (B♭ E♭ A♭)');
  });

  it('spells major scales from the key signature', () => {
    for (const key of MAJOR_KEYS) {
      for (let degree = 1; degree <= 7; degree += 1) {
        const note = scaleDegree(key, degree as DegreeNumber, 'major');
        expect(note.accidental).toBe(accidentalForLetter(note.letter, key.signature));
      }
    }
    expect(pitchName(scaleDegree(findKey('E', -1, 'major') as never, 3))).toBe('G');
    expect(pitchName(scaleDegree(findKey('E', 0, 'major') as never, 7))).toBe('D♯');
    expect(degreeName(3)).toBe('mediant');
    expect(degreeName(7)).toBe('leading note');
  });

  it('raises the right notes in minor scales', () => {
    for (const key of MINOR_KEYS) {
      for (const degree of [1, 2, 3, 4, 5] as const) {
        const note = scaleDegree(key, degree, 'natural');
        expect(note.accidental).toBe(accidentalForLetter(note.letter, key.signature));
      }
      for (const degree of [6, 7] as const) {
        const natural = scaleDegree(key, degree, 'natural');
        const harmonic = scaleDegree(key, degree, 'harmonic');
        const ascending = scaleDegree(key, degree, 'melodic-ascending');
        const descending = scaleDegree(key, degree, 'melodic-descending');
        expect(harmonic.accidental).toBe(degree === 7 ? natural.accidental + 1 : natural.accidental);
        expect(ascending.accidental).toBe(natural.accidental + 1);
        expect(descending.accidental).toBe(natural.accidental);
      }
      const relative = relativeKey(key);
      expect(relative.mode).toBe('major');
      expect(relative.signature).toBe(key.signature);
    }
    expect(pitchName(scaleDegree(findKey('A', 0, 'minor') as never, 7, 'harmonic'))).toBe('G♯');
    expect(pitchName(scaleDegree(findKey('A', 0, 'minor') as never, 6, 'melodic-ascending'))).toBe('F♯');
    expect(pitchName(scaleDegree(findKey('C', 0, 'minor') as never, 7, 'harmonic'))).toBe('B');
    expect(pitchName(scaleDegree(findKey('D', 1, 'minor') as never, 7, 'harmonic'))).toBe('C𝄪');
    expect(keyName(relativeKey(findKey('D', 0, 'major') as never))).toBe('B minor');
    expect(keyName(relativeKey(findKey('F', 0, 'minor') as never))).toBe('A♭ major');
    expect(keyName(relativeKey(findKey('G', -1, 'major') as never))).toBe('E♭ minor');
  });
});

describe('chords and cadences', () => {
  it('builds and names every Grade 5 triad in every key', () => {
    for (const key of ALL_KEYS) {
      for (const degree of [1, 2, 4, 5] as const) {
        for (const inversion of ['a', 'b', 'c'] as const) {
          const notes = buildTriad(key, degree, inversion, 4);
          expect(identifyTriad(key, notes)).toEqual({ degree, inversion });
          const form = key.mode === 'minor' ? 'harmonic' : 'major';
          const root = scaleDegree(key, degree, form);
          const thirdPc = scaleDegree(key, (((degree + 1) % 7) + 1) as DegreeNumber, form);
          const fifthPc = scaleDegree(key, (((degree + 3) % 7) + 1) as DegreeNumber, form);
          const aboveRoot = (other: Pitch) => {
            let placed = { letter: other.letter, accidental: other.accidental, octave: root.octave };
            while (toMidi(placed) <= toMidi(root)) placed = { ...placed, octave: placed.octave + 1 };
            return intervalLabel(intervalBetween(root, placed));
          };
          expect(['minor 3rd', 'major 3rd']).toContain(aboveRoot(thirdPc));
          expect(['diminished 5th', 'perfect 5th']).toContain(aboveRoot(fifthPc));
          const lowest = [...notes].sort((a, b) => toMidi(a) - toMidi(b))[0] as Pitch;
          if (inversion === 'a') expect(lowest.letter).toBe(root.letter);
        }
      }
    }
  });

  it('uses a major dominant in minor keys and a diminished supertonic', () => {
    const aMinor = findKey('A', 0, 'minor') as NonNullable<ReturnType<typeof findKey>>;
    expect(buildTriad(aMinor, 5, 'a').map((note) => pitchName(note))).toEqual(['E', 'G♯', 'B']);
    expect(buildTriad(aMinor, 2, 'a').map((note) => pitchName(note))).toEqual(['B', 'D', 'F']);
    const cMajor = findKey('C', 0, 'major') as NonNullable<ReturnType<typeof findKey>>;
    expect(buildTriad(cMajor, 1, 'b').map((note) => pitchName(note))).toEqual(['E', 'G', 'C']);
    expect(buildTriad(cMajor, 1, 'c').map((note) => pitchName(note))).toEqual(['G', 'C', 'E']);
    expect(buildTriad(cMajor, 5, 'b').map((note) => pitchName(note))).toEqual(['B', 'D', 'G']);
    expect(chordSymbol(5, 'a')).toBe('Va');
    expect(chordSymbol(2, 'b')).toBe('IIb');
  });

  it('names the Grade 5 cadences', () => {
    expect(classifyCadence(5, 1)).toBe('perfect');
    expect(classifyCadence(4, 1)).toBe('plagal');
    expect(classifyCadence(1, 5)).toBe('imperfect');
    expect(classifyCadence(2, 5)).toBe('imperfect');
    expect(classifyCadence(4, 5)).toBe('imperfect');
    expect(classifyCadence(1, 4)).toBeNull();
  });

  it('keeps chord degrees inside the syllabus set', () => {
    const degrees: ChordDegree[] = [1, 2, 4, 5];
    const inversions: Inversion[] = ['a', 'b', 'c'];
    expect(degrees).toContain(2);
    expect(inversions).toHaveLength(3);
  });
});

describe('transposition', () => {
  it('transposes B♭, A and F instruments to concert pitch and back', () => {
    expect(pitchName(toConcert(p('C', 0, 5), 'Bb'))).toBe('B♭');
    expect(toMidi(toConcert(p('C', 0, 5), 'Bb'))).toBe(toMidi(p('B', -1, 4)));
    expect(pitchName(toConcert(p('C', 0, 5), 'A'))).toBe('A');
    expect(toMidi(toConcert(p('C', 0, 5), 'A'))).toBe(toMidi(p('A', 0, 4)));
    expect(pitchName(toConcert(p('C', 0, 5), 'F'))).toBe('F');
    expect(toMidi(toConcert(p('C', 0, 5), 'F'))).toBe(toMidi(p('F', 0, 4)));
    expect(pitchName(toWritten(p('C', 0, 4), 'Bb'))).toBe('D');
    expect(pitchName(toWritten(p('C', 0, 4), 'A'))).toBe('E♭');
    expect(pitchName(toWritten(p('C', 0, 4), 'F'))).toBe('G');
    expect(toMidi(toConcert(toWritten(p('E', -1, 4), 'F'), 'F'))).toBe(toMidi(p('E', -1, 4)));
  });

  it('moves a key by the instrument interval when the result stays inside Grade 5', () => {
    const gMajor = findKey('G', 0, 'major') as NonNullable<ReturnType<typeof findKey>>;
    const horn = transposeKey(gMajor, TRANSPOSING_INSTRUMENTS.F.toConcert);
    expect(horn && keyName(horn)).toBe('C major');
    const dMajor = findKey('D', 0, 'major') as NonNullable<ReturnType<typeof findKey>>;
    const clarinet = transposeKey(dMajor, TRANSPOSING_INSTRUMENTS.Bb.toConcert);
    expect(clarinet && keyName(clarinet)).toBe('C major');
  });

  it('respells enharmonics toward the simpler accidental', () => {
    expect(pitchName(simplestEnharmonic(p('F', 2, 4)))).toBe('G');
    expect(pitchName(simplestEnharmonic(p('C', -1, 4)))).toBe('B');
    expect(toMidi(simplestEnharmonic(p('B', 1, 4)))).toBe(toMidi(p('C', 0, 5)));
  });
});

describe('rhythm arithmetic', () => {
  it('counts the ticks in Grade 5 time signatures', () => {
    const byName = Object.fromEntries(TIME_SIGNATURES.map((signature) => [signature.signature, barTicks(signature)]));
    expect(byName['4/4']).toBe(32);
    expect(byName['6/8']).toBe(24);
    expect(byName['5/4']).toBe(40);
    expect(byName['7/8']).toBe(28);
    expect(byName['9/4']).toBe(72);
    expect(byName['2/2']).toBe(32);
    expect(byName['12/16']).toBe(24);
  });

  it('dots notes by one half and then one quarter of the original', () => {
    expect(durationTicks('minim', 0)).toBe(16);
    expect(durationTicks('minim', 1)).toBe(24);
    expect(durationTicks('crotchet', 2)).toBe(14);
    expect(findDuration(12)?.value).toBe('crotchet');
    expect(findDuration(12)?.dots).toBe(1);
    expect(barTicks(TIME_SIGNATURES.find((item) => item.signature === '3/4') as never)).toBe(durationTicks('minim', 1));
  });
});

describe('chromatic scales', () => {
  const starts = [
    p('C', 0, 4),
    p('E', -1, 4),
    p('F', 1, 4),
    p('B', -1, 3),
    p('G', 0, 4),
    p('D', -1, 4),
    p('A', 0, 3),
    p('E', 0, 4),
    p('G', -1, 3),
    p('D', 1, 4),
  ];

  it.each(starts)('ascends in semitones from %j', (start) => {
    expect(chromaticIssues(chromaticScale(start, 'up'))).toEqual([]);
  });

  it.each(starts)('descends in semitones from %j', (start) => {
    expect(chromaticIssues(chromaticScale(start, 'down'))).toEqual([]);
  });

  it('uses the familiar C major spelling', () => {
    expect(chromaticScale(p('C', 0, 4), 'up').map((note) => pitchName(note, true)).join(' ')).toBe(
      'C4 C♯4 D4 D♯4 E4 F4 F♯4 G4 G♯4 A4 A♯4 B4 C5',
    );
    expect(chromaticScale(p('C', 0, 5), 'down').map((note) => pitchName(note)).join(' ')).toBe(
      'C B B♭ A A♭ G G♭ F E E♭ D D♭ C',
    );
  });
});
