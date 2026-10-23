export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Letter = (typeof LETTERS)[number];
export type Accidental = -2 | -1 | 0 | 1 | 2;

export interface Pitch {
  letter: Letter;
  accidental: Accidental;
  octave: number;
}

const SEMITONE: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export function pitch(letter: Letter, accidental: Accidental, octave: number): Pitch {
  return { letter, accidental, octave };
}

export function letterIndex(letter: Letter): number {
  return LETTERS.indexOf(letter);
}

/** Scientific pitch: C4 is middle C, MIDI 60. */
export function toMidi(pitch: Pitch): number {
  return (pitch.octave + 1) * 12 + SEMITONE[pitch.letter] + pitch.accidental;
}

export function pitchName(pitch: Pitch, withOctave = false): string {
  const symbol =
    pitch.accidental === -2
      ? '𝄫'
      : pitch.accidental === -1
        ? '♭'
        : pitch.accidental === 1
          ? '♯'
          : pitch.accidental === 2
            ? '𝄪'
            : '';
  const name = `${pitch.letter}${symbol}`;
  return withOctave ? `${name}${pitch.octave}` : name;
}

export function samePitch(a: Pitch, b: Pitch): boolean {
  return a.letter === b.letter && a.accidental === b.accidental && a.octave === b.octave;
}

export function addLetterSteps(pitch: Pitch, steps: number): { letter: Letter; octave: number } {
  const sum = letterIndex(pitch.letter) + steps;
  const octaveShift = Math.floor(sum / 7);
  const newIndex = ((sum % 7) + 7) % 7;
  return { letter: LETTERS[newIndex], octave: pitch.octave + octaveShift };
}

/** Every spelling of a MIDI pitch using accidentals from double flat to double sharp. */
export function spellingsAtMidi(midi: number): Pitch[] {
  const found: Pitch[] = [];
  for (const letter of LETTERS) {
    for (let accidental = -2; accidental <= 2; accidental += 1) {
      const shifted = midi - accidental - SEMITONE[letter];
      if (shifted % 12 !== 0) continue;
      const octave = shifted / 12 - 1;
      if (Number.isInteger(octave) && octave >= -1 && octave <= 9) {
        found.push({ letter, accidental: accidental as Accidental, octave });
      }
    }
  }
  return found;
}

export function simplestEnharmonic(pitch: Pitch): Pitch {
  const alternatives = spellingsAtMidi(toMidi(pitch)).filter(
    (spelling) => spelling.letter !== pitch.letter || spelling.accidental !== pitch.accidental,
  );
  alternatives.sort(
    (a, b) => Math.abs(a.accidental) - Math.abs(b.accidental) || a.letter.charCodeAt(0) - b.letter.charCodeAt(0),
  );
  const best = alternatives[0];
  if (!best) throw new Error(`No enharmonic spelling for ${pitchName(pitch, true)}`);
  return best;
}

export function vexKey(pitch: Pitch): string {
  const accidental =
    pitch.accidental === 1 ? '#' : pitch.accidental === 2 ? '##' : pitch.accidental === -1 ? 'b' : pitch.accidental === -2 ? 'bb' : '';
  return `${pitch.letter.toLowerCase()}${accidental}/${pitch.octave}`;
}

export function vexAccidental(accidental: Accidental): string | null {
  if (accidental === 1) return '#';
  if (accidental === 2) return '##';
  if (accidental === -1) return 'b';
  if (accidental === -2) return 'bb';
  return null;
}
