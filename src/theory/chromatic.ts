import { letterIndex, LETTERS, pitchName, spellingsAtMidi, toMidi, type Letter, type Pitch } from './pitch';

/**
 * Melodic chromatic spelling used for Grade 5 checks:
 * semitone steps, the same spelling at both ends, no letter more than twice
 * before the final octave note, sharps preferred on the way up and flats on
 * the way down, with the natural semitones E–F and B–C kept as neighbour letters.
 */
export function chromaticScale(start: Pitch, direction: 'up' | 'down'): Pitch[] {
  const sign = direction === 'up' ? 1 : -1;
  const notes: Pitch[] = [{ ...start }];
  const used: Record<Letter, number> = { C: 0, D: 0, E: 0, F: 0, G: 0, A: 0, B: 0 };
  used[start.letter] += 1;

  for (let step = 1; step <= 11; step += 1) {
    const midi = toMidi(start) + sign * step;
    const previous = notes[notes.length - 1] as Pitch;
    const options = spellingsAtMidi(midi);
    const available = (pitch: Pitch) => used[pitch.letter] < 2;
    let chosen: Pitch | undefined;

    if (direction === 'up' && previous.accidental === 0 && (previous.letter === 'E' || previous.letter === 'B')) {
      const nextLetter = previous.letter === 'E' ? 'F' : 'C';
      chosen = options.find((pitch) => pitch.letter === nextLetter && pitch.accidental === 0 && available(pitch));
    }
    if (direction === 'down' && previous.accidental === 0 && (previous.letter === 'F' || previous.letter === 'C')) {
      const nextLetter = previous.letter === 'F' ? 'E' : 'B';
      chosen = options.find((pitch) => pitch.letter === nextLetter && pitch.accidental === 0 && available(pitch));
    }
    if (!chosen) {
      chosen = options.find(
        (pitch) =>
          pitch.letter === previous.letter &&
          pitch.accidental === previous.accidental + sign &&
          Math.abs(pitch.accidental) <= 1 &&
          available(pitch),
      );
    }
    if (!chosen) {
      const nextIndex = (letterIndex(previous.letter) + sign + 7) % 7;
      const nextLetter = LETTERS[nextIndex] as Letter;
      const nextOptions = options.filter(
        (pitch) => pitch.letter === nextLetter && available(pitch) && Math.abs(pitch.accidental) <= 1,
      );
      nextOptions.sort((a, b) => (direction === 'up' ? b.accidental - a.accidental : a.accidental - b.accidental));
      chosen = nextOptions[0];
    }
    if (!chosen) {
      const fallback = options
        .filter((pitch) => available(pitch))
        .sort((a, b) => Math.abs(a.accidental) - Math.abs(b.accidental));
      chosen = fallback[0];
    }
    if (!chosen) throw new Error(`No chromatic spelling ${step} steps ${direction} from ${pitchName(start, true)}`);
    notes.push(chosen);
    used[chosen.letter] += 1;
  }

  notes.push({ ...start, octave: start.octave + sign });
  return notes;
}

export function chromaticIssues(notes: Pitch[]): string[] {
  const issues: string[] = [];
  if (notes.length !== 13) issues.push(`expected 13 notes, found ${notes.length}`);
  const direction = notes.length > 1 && toMidi(notes[1] as Pitch) < toMidi(notes[0] as Pitch) ? -1 : 1;
  for (let index = 1; index < notes.length; index += 1) {
    const gap = toMidi(notes[index] as Pitch) - toMidi(notes[index - 1] as Pitch);
    if (gap !== direction) issues.push(`step ${index} is ${gap} semitones`);
  }
  const start = notes[0];
  const end = notes[notes.length - 1];
  if (start && end && (start.letter !== end.letter || start.accidental !== end.accidental)) {
    issues.push('the first and last spellings do not match');
  }
  const counts: Record<string, number> = {};
  notes.slice(0, 12).forEach((note) => {
    counts[note.letter] = (counts[note.letter] ?? 0) + 1;
  });
  for (const [letter, count] of Object.entries(counts)) {
    if (count > 2) issues.push(`${letter} is used ${count} times before the final note`);
  }
  return issues;
}
