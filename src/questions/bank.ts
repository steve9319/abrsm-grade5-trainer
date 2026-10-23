import { INSTRUMENTS, VOICES } from '../content/instruments';
import { ORNAMENTS, SIGNS, TERMS } from '../content/terms';
import type { ClefName, NotationEvent, NotationSpec } from '../notation/types';
import { staff } from '../notation/types';
import { chromaticScale } from '../theory/chromatic';
import {
  buildTriad,
  chordSymbol,
  classifyCadence,
  explainCadence,
  triadExplanation,
  type ChordDegree,
} from '../theory/chord';
import { explainInterval, intervalBetween, intervalLabel, isPerfectType, transposeByInterval, type Interval, type Quality } from '../theory/interval';
import {
  CADENCE_KEYS,
  MAJOR_KEYS,
  MINOR_KEYS,
  degreeName,
  keyName,
  relativeKey,
  scaleDegree,
  signatureSummary,
  vexflowKeyName,
  type DegreeNumber,
  type KeySpec,
  type ScaleForm,
} from '../theory/key';
import { LETTERS, addLetterSteps, pitch, pitchName, simplestEnharmonic, spellingsAtMidi, toMidi, type Accidental, type Pitch } from '../theory/pitch';
import {
  DURATION_CATALOG,
  TIME_SIGNATURES,
  TUPLETS,
  barTicks,
  durationLabel,
  type NoteValue,
  type TimeSignatureInfo,
} from '../theory/rhythm';
import { pick, shuffle, type Rng } from '../theory/random';
import {
  TRANSPOSING_INSTRUMENTS,
  describeTransposition,
  invertInterval,
  toConcert,
  transposeKey,
} from '../theory/transpose';
import type { Question, TopicId } from './types';

const CLEFS: ClefName[] = ['treble', 'bass', 'alto', 'tenor'];

const CLEF_RANGE: Record<ClefName, [number, number]> = {
  treble: [60, 81],
  bass: [40, 64],
  alto: [52, 74],
  tenor: [53, 76],
};

let serial = 0;

function ask(
  topic: TopicId,
  prompt: string,
  correct: string,
  distractors: string[],
  explanation: string,
  notation?: NotationSpec,
  rng?: Rng,
): Question {
  const wrong = [...new Set(distractors.filter((item) => item && item !== correct))];
  if (wrong.length < 3) throw new Error(`Not enough options for: ${prompt}`);
  const labels = shuffle(rng ?? Math.random, [correct, ...shuffle(rng ?? Math.random, wrong).slice(0, 3)]);
  serial += 1;
  return {
    id: `${topic}-${serial}`,
    topic,
    prompt,
    explanation,
    notation,
    correctId: correct,
    choices: labels.map((label) => ({ id: label, label })),
  };
}

function pitchesInClef(clef: ClefName, accidentals: Accidental[]): Pitch[] {
  const [low, high] = CLEF_RANGE[clef];
  const found: Pitch[] = [];
  for (const letter of LETTERS) {
    for (const accidental of accidentals) {
      for (let octave = 2; octave <= 6; octave += 1) {
        const candidate = pitch(letter, accidental, octave);
        const midi = toMidi(candidate);
        if (midi >= low && midi <= high) found.push(candidate);
      }
    }
  }
  return found;
}

function fitToClef(source: Pitch, clef: ClefName): Pitch | null {
  const [low, high] = CLEF_RANGE[clef];
  for (let octave = 2; octave <= 6; octave += 1) {
    const candidate = pitch(source.letter, source.accidental, octave);
    const midi = toMidi(candidate);
    if (midi >= low && midi <= high) return candidate;
  }
  return null;
}

function noteValueQuestion(rng: Rng): Question {
  const piece = pick(
    rng,
    DURATION_CATALOG.filter((item) => item.value !== 'breve' && item.dots < 2 && item.ticks >= 2),
  );
  const american = rng() > 0.5;
  const correct = american ? VALUE_AMERICAN(piece.value, piece.dots) : durationLabel(piece.value, piece.dots);
  const pool = DURATION_CATALOG.filter((item) => item.ticks !== piece.ticks).map((item) =>
    american ? VALUE_AMERICAN(item.value, item.dots) : durationLabel(item.value, item.dots),
  );
  const clef = pick(rng, CLEFS);
  const shown = pick(rng, pitchesInClef(clef, [0]));
  return ask(
    'rhythm',
    american
      ? 'What is the American name for this note?'
      : 'What is the British name for this note?',
    correct,
    pool,
    american
      ? `The British name is ${durationLabel(piece.value, piece.dots)}. In American names that is a ${correct}. ABRSM accepts either language.`
      : `This is a ${correct}. The American name is ${VALUE_AMERICAN(piece.value, piece.dots)}.`,
    staff({
      clef,
      events: [{ kind: 'note', pitches: [shown], value: piece.value, dots: piece.dots }],
    }),
    rng,
  );
}

function VALUE_AMERICAN(value: NoteValue, dots: number): string {
  const names: Record<NoteValue, string> = {
    breve: 'double whole note',
    semibreve: 'whole note',
    minim: 'half note',
    crotchet: 'quarter note',
    quaver: 'eighth note',
    semiquaver: '16th note',
    demisemiquaver: '32nd note',
  };
  const dotted = dots === 2 ? 'double-dotted ' : dots === 1 ? 'dotted ' : '';
  return `${dotted}${names[value]}`;
}

function meterQuestion(rng: Rng): Question {
  const time = pick(rng, TIME_SIGNATURES);
  const classes = [...new Set(TIME_SIGNATURES.map((item) => item.className))];
  return ask(
    'rhythm',
    'What kind of time signature is this?',
    time.className,
    classes,
    `${time.signature} is ${time.className}: ${time.grouping}. The top number is ${time.numerator} and the beat is a ${time.beatName}.`,
    staff({
      clef: 'treble',
      timeSignature: time.signature,
      events: [{ kind: 'rest', value: 'semibreve' }],
    }),
    rng,
  );
}

function beatQuestion(rng: Rng): Question {
  const time = pick(rng, TIME_SIGNATURES);
  const correct = String(time.beatCount);
  return ask(
    'rhythm',
    `How many ${time.beatName} beats are there in one bar of ${time.signature}?`,
    correct,
    ['2', '3', '4', '5', '6', '7', '8', '9'],
    `${time.signature} is ${time.className}, grouped as ${time.grouping}. That is ${time.beatCount} ${time.beatName} beat${time.beatCount === 1 ? '' : 's'}.`,
    undefined,
    rng,
  );
}

function groupingQuestion(rng: Rng): Question {
  const time = pick(
    rng,
    TIME_SIGNATURES.filter((item) => ['5/8', '7/8', '5/4', '7/4', '6/8', '9/8', '12/8', '6/4'].includes(item.signature)),
  );
  return ask(
    'rhythm',
    `How are notes and rests usually grouped in ${time.signature}?`,
    time.grouping,
    TIME_SIGNATURES.map((item) => item.grouping),
    `${time.signature} is ${time.className}. ${time.grouping.charAt(0).toUpperCase()}${time.grouping.slice(1)}.`,
    undefined,
    rng,
  );
}

function completeBar(rng: Rng): Question {
  const time = pick(
    rng,
    TIME_SIGNATURES.filter((item) => ['2/4', '3/4', '4/4', '6/8', '5/8', '3/8', '2/2', '5/4', '7/8'].includes(item.signature)),
  );
  const total = barTicks(time);
  const remainders = DURATION_CATALOG.filter((item) => item.ticks < total && item.ticks >= 2 && item.dots < 2);
  const remainder = pick(rng, remainders);
  const clef = pick(rng, ['treble', 'bass'] as const);
  const ladder = clef === 'treble'
    ? [pitch('E', 0, 4), pitch('G', 0, 4), pitch('A', 0, 4), pitch('C', 0, 5)]
    : [pitch('G', 0, 2), pitch('B', 0, 2), pitch('D', 0, 3), pitch('F', 0, 3)];
  const pieces = [...DURATION_CATALOG].filter((item) => item.value !== 'breve' && item.dots < 2).sort((a, b) => b.ticks - a.ticks);
  const events: NotationEvent[] = [];
  let left = total - remainder.ticks;
  let cursor = 0;
  while (left > 0) {
    const piece = pieces.find((item) => item.ticks <= left);
    if (!piece) throw new Error('Could not fill the bar');
    events.push({ kind: 'note', pitches: [ladder[cursor % ladder.length] as Pitch], value: piece.value, dots: piece.dots });
    left -= piece.ticks;
    cursor += 1;
    if (events.length > 8) throw new Error('Bar split is too long');
  }
  const correct = durationLabel(remainder.value, remainder.dots, true);
  return ask(
    'rhythm',
    'Which rest completes the bar?',
    correct,
    DURATION_CATALOG.filter((item) => item.ticks !== remainder.ticks && item.ticks <= total).map((item) =>
      durationLabel(item.value, item.dots, true),
    ),
    `${time.signature} is ${time.className} (${time.grouping}). The notes shown leave exactly a ${correct}.`,
    staff({ clef, timeSignature: time.signature, events }),
    rng,
  );
}

function tupletQuestion(rng: Rng): Question {
  const tuplet = pick(rng, TUPLETS);
  const groupId = 'tuplet';
  const melody = [pitch('G', 0, 4), pitch('A', 0, 4), pitch('B', 0, 4), pitch('C', 0, 5), pitch('D', 0, 5), pitch('E', 0, 5)];
  const events: NotationEvent[] = Array.from({ length: tuplet.notes }, (_, index) => ({
    kind: 'note',
    pitches: [melody[index % melody.length] as Pitch],
    value: tuplet.written,
    tuplet: { notes: tuplet.notes, occupied: tuplet.occupied, groupId },
  }));
  let time = '2/4';
  if (tuplet.name === 'duplet') {
    time = '6/8';
    events.push(
      { kind: 'note', pitches: [pitch('F', 0, 4)], value: 'quaver' },
      { kind: 'note', pitches: [pitch('E', 0, 4)], value: 'quaver' },
      { kind: 'note', pitches: [pitch('D', 0, 4)], value: 'quaver' },
    );
  } else if (tuplet.written !== 'crotchet') {
    events.push({ kind: 'note', pitches: [pitch('F', 0, 4)], value: 'crotchet' });
  }
  return ask(
    'rhythm',
    'The bracketed group lasts as long as which single note?',
    tuplet.equals,
    ['crotchet', 'minim', 'quaver', 'dotted crotchet', 'semiquaver', 'dotted minim', 'semibreve'],
    tuplet.explanation,
    staff({ clef: 'treble', timeSignature: time, events }),
    rng,
  );
}

function namePitch(rng: Rng): Question {
  const clef = pick(rng, CLEFS);
  const accidentals: Accidental[] = rng() < 0.2 ? [-2, -1, 0, 1, 2] : [-1, 0, 1];
  const shown = pick(rng, pitchesInClef(clef, accidentals));
  const correct = pitchName(shown);
  const distractors = new Set<string>();
  for (const accidental of [-2, -1, 0, 1, 2] as const) {
    if (accidental !== shown.accidental) distractors.add(pitchName(pitch(shown.letter, accidental, shown.octave)));
  }
  for (const step of [-2, -1, 1, 2]) {
    const moved = addLetterSteps(shown, step);
    distractors.add(pitchName(pitch(moved.letter, shown.accidental, moved.octave)));
    distractors.add(pitchName(pitch(moved.letter, 0, moved.octave)));
  }
  const clefHelp: Record<ClefName, string> = {
    treble: 'The treble clef fixes G4 on the second line.',
    bass: 'The bass clef fixes F3 on the fourth line.',
    alto: 'The alto clef fixes middle C, C4, on the middle line.',
    tenor: 'The tenor clef fixes middle C, C4, on the fourth line.',
  };
  return ask(
    'pitch',
    `Name this note in the ${clef} clef.`,
    correct,
    [...distractors],
    `${clefHelp[clef]} Reading from there, the note is ${correct}.`,
    staff({ clef, events: [{ kind: 'note', pitches: [shown], value: 'semibreve' }] }),
    rng,
  );
}

function enharmonicQuestion(rng: Rng): Question {
  const clef = pick(rng, ['treble', 'bass', 'alto'] as const);
  const pool = pitchesInClef(clef, rng() < 0.45 ? [1, -1, 2, -2] : [1, -1]).filter((item) => item.accidental !== 0);
  const shown = pick(rng, pool);
  const equivalent = simplestEnharmonic(shown);
  const correct = pitchName(equivalent);
  const distractors = LETTERS.flatMap((letter) => [pitchName(pitch(letter, 0, 4)), pitchName(pitch(letter, 1, 4)), pitchName(pitch(letter, -1, 4))]);
  return ask(
    'pitch',
    'Which note is the simplest enharmonic equivalent of the printed note?',
    correct,
    distractors,
    `${pitchName(shown)} sounds the same as ${correct}. An enharmonic equivalent is the same pitch spelled with a different letter. Double sharps and double flats are part of the Grade 5 syllabus.`,
    staff({ clef, events: [{ kind: 'note', pitches: [shown], value: 'semibreve' }] }),
    rng,
  );
}

function keySignatureQuestion(rng: Rng, mode: 'major' | 'minor'): Question {
  const key = pick(rng, mode === 'major' ? MAJOR_KEYS : MINOR_KEYS);
  const clef = pick(rng, CLEFS);
  const pool = (mode === 'major' ? MAJOR_KEYS : MINOR_KEYS).map(keyName);
  const relative = keyName(relativeKey(key));
  return ask(
    'keys',
    `Name this ${mode} key.`,
    keyName(key),
    [...pool, relative],
    `${keyName(key)} has ${signatureSummary(key.signature)}. Its relative ${mode === 'major' ? 'minor' : 'major'} is ${relative}, which shares this signature, so read the question’s major or minor carefully.`,
    staff({
      clef,
      keySignature: vexflowKeyName(key),
      signatureCount: key.signature,
      events: [{ kind: 'rest', value: 'semibreve' }],
    }),
    rng,
  );
}

function relativeQuestion(rng: Rng): Question {
  const key = pick(rng, [...MAJOR_KEYS, ...MINOR_KEYS]);
  const relative = relativeKey(key);
  const correct = keyName(relative);
  const sameMode = (key.mode === 'major' ? MAJOR_KEYS : MINOR_KEYS).map(keyName);
  return ask(
    'keys',
    `What is the relative ${relative.mode} of ${keyName(key)}?`,
    correct,
    [...(relative.mode === 'major' ? MAJOR_KEYS : MINOR_KEYS).map(keyName), ...sameMode],
    `Relative keys share a signature. ${keyName(key)} has ${signatureSummary(key.signature)}, so its relative ${relative.mode} is ${correct}.`,
    undefined,
    rng,
  );
}

function degreeQuestion(rng: Rng): Question {
  const key = pick(rng, [...MAJOR_KEYS, ...MINOR_KEYS]);
  const form: ScaleForm = key.mode === 'minor' ? 'harmonic' : 'major';
  const degree = pick(rng, [1, 2, 3, 4, 5, 6, 7] as const);
  const note = scaleDegree(key, degree, form);
  const askForNote = rng() > 0.5;
  if (askForNote) {
    const correct = pitchName(note);
    const distractors = ([1, 2, 3, 4, 5, 6, 7] as const)
      .filter((item) => item !== degree)
      .map((item) => pitchName(scaleDegree(key, item, form)));
    return ask(
      'keys',
      `In ${key.mode === 'minor' ? 'the harmonic form of ' : ''}${keyName(key)}, which note is the ${degreeName(degree)}?`,
      correct,
      distractors,
      `Counting up the scale from the tonic, degree ${degree} is the ${degreeName(degree)}: ${correct}. ${key.mode === 'minor' ? 'The harmonic minor raises the leading note.' : ''}`,
      undefined,
      rng,
    );
  }
  const correct = degreeName(degree);
  return ask(
    'keys',
    `In ${key.mode === 'minor' ? 'the harmonic form of ' : ''}${keyName(key)}, what is ${pitchName(note)}?`,
    correct,
    [...['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant', 'leading note']],
    `${pitchName(note)} is degree ${degree} of ${keyName(key)}, the ${correct}.`,
    undefined,
    rng,
  );
}

function minorFormQuestion(rng: Rng): Question {
  const key = pick(rng, MINOR_KEYS);
  const sixth = scaleDegree(key, 6, 'natural');
  const seventh = scaleDegree(key, 7, 'natural');
  const raisedSixth = scaleDegree(key, 6, 'melodic-ascending');
  const raisedSeventh = scaleDegree(key, 7, 'harmonic');
  if (rng() > 0.5) {
    const correct = pitchName(raisedSeventh);
    return ask(
      'keys',
      `Which note is raised in the harmonic minor scale of ${keyName(key)}?`,
      correct,
      [pitchName(sixth), pitchName(seventh), pitchName(raisedSixth), pitchName(scaleDegree(key, 3, 'natural')), pitchName(scaleDegree(key, 2, 'natural'))],
      `Harmonic minor raises the 7th degree, the leading note. In ${keyName(key)} the key signature has ${pitchName(seventh)} as degree 7, so the harmonic form uses ${correct}.`,
      undefined,
      rng,
    );
  }
  const correct = `${pitchName(raisedSixth)} and ${pitchName(raisedSeventh)}`;
  return ask(
    'keys',
    `Which notes are raised in the ascending melodic minor of ${keyName(key)}?`,
    correct,
    [
      `only ${pitchName(raisedSeventh)}`,
      `only ${pitchName(raisedSixth)}`,
      `${pitchName(sixth)} and ${pitchName(seventh)}`,
      `${pitchName(raisedSeventh)} and ${pitchName(scaleDegree(key, 1, 'natural'))}`,
    ],
    `Ascending melodic minor raises both the 6th and the 7th. Descending, and in the natural minor, those notes go back to the key signature: ${pitchName(sixth)} and ${pitchName(seventh)}.`,
    undefined,
    rng,
  );
}

function chromaticQuestion(rng: Rng): Question {
  const start = pick(rng, [pitch('C', 0, 4), pitch('E', -1, 4), pitch('F', 1, 4), pitch('B', -1, 3), pitch('G', 0, 4), pitch('D', 0, 4), pitch('A', 0, 3)]);
  const direction = rng() > 0.5 ? 'up' : 'down';
  const scale = chromaticScale(start, direction);
  const correct = `${pitchName(scale[1] as Pitch)}, ${pitchName(scale[2] as Pitch)}`;
  const otherSpell = (item: Pitch) => pitchName(simplestEnharmonic(item));
  const distractors = [
    `${otherSpell(scale[1] as Pitch)}, ${pitchName(scale[2] as Pitch)}`,
    `${pitchName(scale[2] as Pitch)}, ${pitchName(scale[3] as Pitch)}`,
    `${pitchName(scale[1] as Pitch)}, ${pitchName(scale[4] as Pitch)}`,
    `${otherSpell(scale[1] as Pitch)}, ${otherSpell(scale[2] as Pitch)}`,
  ];
  return ask(
    'keys',
    `A chromatic scale ${direction === 'up' ? 'ascending' : 'descending'} starts on ${pitchName(start)}. Which spelling is right for the next two notes?`,
    correct,
    distractors,
    `A chromatic scale moves by semitones and keeps the same spelling at both ends. No letter is used more than twice before the final note. Going up, prefer sharps; going down, prefer flats. The natural semitones are E–F and B–C. From ${pitchName(start)} the next notes are ${correct}.`,
    staff({
      clef: toMidi(start) < 55 ? 'bass' : 'treble',
      events: [{ kind: 'note', pitches: [start], value: 'semibreve' }],
    }),
    rng,
  );
}

const SIMPLE_QUALITIES: Quality[] = ['diminished', 'minor', 'major', 'augmented', 'perfect'];

function printableInterval(rng: Rng, compound: boolean): { lower: Pitch; upper: Pitch; interval: Interval } | null {
  const numbers = compound ? [9, 10, 11, 12, 13] : [2, 3, 4, 5, 6, 7, 8];
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const number = pick(rng, numbers);
    const quality = pick(rng, isPerfectType(number) ? (['perfect', 'augmented', 'diminished'] as const) : (['major', 'minor', 'augmented', 'diminished'] as const));
    const lower = pick(rng, pitchesInClef('treble', [-1, 0, 1]));
    try {
      const upper = transposeByInterval(lower, { number, quality, direction: 'up' });
      if (upper.octave > 6 || toMidi(upper) > 88) continue;
      return { lower, upper, interval: intervalBetween(lower, upper) };
    } catch {
      continue;
    }
  }
  return null;
}

function intervalNameQuestion(rng: Rng): Question {
  const compound = rng() > 0.55;
  const made = printableInterval(rng, compound);
  if (!made) throw new Error('No interval');
  const correct = intervalLabel(made.interval);
  const distractors: string[] = [];
  for (const quality of SIMPLE_QUALITIES) {
    if (quality === made.interval.quality) continue;
    if (isPerfectType(made.interval.number) && (quality === 'major' || quality === 'minor')) continue;
    if (!isPerfectType(made.interval.number) && quality === 'perfect') continue;
    distractors.push(intervalLabel({ number: made.interval.number, quality }));
  }
  for (const number of [made.interval.number - 1, made.interval.number + 1, made.interval.number > 8 ? made.interval.number - 7 : made.interval.number + 7]) {
    if (number < 2 || number > 15) continue;
    const quality = isPerfectType(number) ? 'perfect' : 'major';
    distractors.push(intervalLabel({ number, quality }));
  }
  return ask(
    'intervals',
    'Name this interval. Count the letters first, then decide the quality.',
    correct,
    distractors,
    explainInterval(made.lower, made.upper),
    staff({
      clef: 'treble',
      events: [
        { kind: 'note', pitches: [made.lower], value: 'crotchet' },
        { kind: 'note', pitches: [made.upper], value: 'crotchet' },
      ],
    }),
    rng,
  );
}

function intervalWriteQuestion(rng: Rng): Question {
  const number = pick(rng, [2, 3, 4, 5, 6, 7, 8]);
  const quality = pick(rng, isPerfectType(number) ? (['perfect', 'augmented', 'diminished'] as const) : (['major', 'minor', 'diminished', 'augmented'] as const));
  const direction = rng() > 0.5 ? 'up' : 'down';
  let lower: Pitch | null = null;
  let result: Pitch | null = null;
  for (let attempt = 0; attempt < 25 && !result; attempt += 1) {
    const candidate = pick(rng, pitchesInClef(direction === 'up' ? 'treble' : 'bass', [-1, 0, 1]));
    try {
      const transposed = transposeByInterval(candidate, { number, quality, direction });
      if (transposed.octave >= 2 && transposed.octave <= 6) {
        lower = candidate;
        result = transposed;
      }
    } catch {
      continue;
    }
  }
  if (!lower || !result) throw new Error('No writable interval');
  const correct = pitchName(result);
  const distractors = spellingsAtMidi(toMidi(result))
    .map((item) => pitchName(item))
    .concat(LETTERS.map((letter) => pitchName(pitch(letter, 0, 4))));
  return ask(
    'intervals',
    `Which note is a ${intervalLabel({ number, quality })} ${direction === 'up' ? 'above' : 'below'} the printed note?`,
    correct,
    distractors,
    `A ${intervalLabel({ number, quality })} ${direction} from ${pitchName(lower)} is ${correct}. The number fixes the letter; the quality fixes the accidental.`,
    staff({
      clef: direction === 'up' ? 'treble' : 'bass',
      events: [{ kind: 'note', pitches: [lower], value: 'semibreve' }],
    }),
    rng,
  );
}

function chordQuestion(rng: Rng): Question {
  const key = pick(rng, [...MAJOR_KEYS, ...MINOR_KEYS]);
  const degree = pick(rng, [1, 2, 4, 5] as const);
  const inversion = pick(rng, ['a', 'b', 'c'] as const);
  const clef = pick(rng, CLEFS);
  const octave = clef === 'bass' ? 3 : 4;
  let notes = buildTriad(key, degree, inversion, octave);
  if (toMidi(notes[2] as Pitch) > (CLEF_RANGE[clef][1] + 5)) notes = buildTriad(key, degree, inversion, octave - 1);
  const correct = chordSymbol(degree, inversion);
  const symbols = ([1, 2, 4, 5] as const).flatMap((item) => (['a', 'b', 'c'] as const).map((inv) => chordSymbol(item, inv)));
  return ask(
    'chords',
    `The key is ${keyName(key)}. Name the chord. Use a for root position, b for first inversion and c for second inversion.`,
    correct,
    symbols,
    triadExplanation(key, degree, inversion),
    staff({ clef, events: [{ kind: 'note', pitches: notes, value: 'semibreve' }] }),
    rng,
  );
}

function cadenceQuestion(rng: Rng): Question {
  const key = pick(rng, CADENCE_KEYS);
  const pairs: [ChordDegree, ChordDegree][] = [
    [5, 1],
    [4, 1],
    [1, 5],
    [2, 5],
    [4, 5],
  ];
  const [first, second] = pick(rng, pairs);
  const name = classifyCadence(first, second);
  if (!name) throw new Error('cadence');
  const clef = rng() > 0.5 ? 'treble' : 'bass';
  const octave = clef === 'bass' ? 3 : 4;
  return ask(
    'chords',
    `The key is ${keyName(key)}. What cadence do these two chords make?`,
    name,
    ['perfect', 'plagal', 'imperfect', 'interrupted'],
    `${explainCadence(first, second)} The interrupted cadence, V–VI, is not required until Grade 6.`,
    staff({
      clef,
      timeSignature: '4/4',
      events: [
        { kind: 'note', pitches: buildTriad(key, first, 'a', octave), value: 'minim' },
        { kind: 'note', pitches: buildTriad(key, second, 'a', octave), value: 'minim' },
      ],
    }),
    rng,
  );
}

function suitableChord(rng: Rng): Question {
  const key = pick(rng, CADENCE_KEYS);
  const kind = pick(rng, ['perfect', 'plagal', 'imperfect'] as const);
  const correct = kind === 'imperfect' ? 'Va' : 'Ia';
  const previous = kind === 'perfect' ? 'V' : kind === 'plagal' ? 'IV' : 'I';
  return ask(
    'chords',
    `A phrase in ${keyName(key)} is harmonised with ${previous} and then one more chord to make a ${kind} cadence. Which chord comes second?`,
    correct,
    ['Ia', 'IIa', 'IVa', 'Va', 'Ic'],
    kind === 'perfect'
      ? 'A perfect cadence is V–I. The second chord is Ia, the tonic in root position.'
      : kind === 'plagal'
        ? 'A plagal cadence is IV–I. The second chord is Ia.'
        : 'An imperfect cadence ends on the dominant. After chord I, the finishing chord of this imperfect cadence is Va.',
    undefined,
    rng,
  );
}

function concertQuestion(rng: Rng, toWrittenPitch: boolean): Question {
  const instrument = pick(rng, ['Bb', 'A', 'F'] as const);
  let written: Pitch | null = null;
  let concert: Pitch | null = null;
  for (let attempt = 0; attempt < 20 && !concert; attempt += 1) {
    const candidate = pick(rng, pitchesInClef('treble', [-1, 0, 1]));
    try {
      const sounded = toConcert(candidate, instrument);
      if (sounded.octave >= 3 && sounded.octave <= 6) {
        written = candidate;
        concert = sounded;
      }
    } catch {
      continue;
    }
  }
  if (!written || !concert) throw new Error('No instrument transposition');
  const spec = TRANSPOSING_INSTRUMENTS[instrument];
  if (toWrittenPitch) {
    const correct = pitchName(written);
    return ask(
      'transposition',
      `The concert pitch is ${pitchName(concert)}. ${describeTransposition(instrument, 'to-written')} Which note is written for the player?`,
      correct,
      spellingsAtMidi(toMidi(written)).map((item) => pitchName(item)).concat(['C', 'D', 'E', 'F', 'G', 'A', 'B']),
      `${spec.examples.charAt(0).toUpperCase()}${spec.examples.slice(1)} write a ${invertInterval(spec.toConcert).quality} ${invertInterval(spec.toConcert).number === 2 ? '2nd' : invertInterval(spec.toConcert).number === 3 ? '3rd' : '5th'} above the concert note. ${pitchName(concert)} is written as ${correct}.`,
      staff({ clef: 'treble', events: [{ kind: 'note', pitches: [concert], value: 'semibreve' }] }),
      rng,
    );
  }
  return ask(
    'transposition',
    `This note is written for an instrument in ${spec.writtenName} (${spec.examples}). ${describeTransposition(instrument, 'to-concert')} What is the concert pitch?`,
    pitchName(concert),
    spellingsAtMidi(toMidi(concert)).map((item) => pitchName(item)).concat(['C', 'D', 'E', 'F', 'G', 'A', 'B']),
    `Written ${pitchName(written)} sounds as ${pitchName(concert)}. The exam tells you the interval; here it is a ${spec.toConcert.quality} ${spec.toConcert.number === 2 ? '2nd' : spec.toConcert.number === 3 ? '3rd' : '5th'} down.`,
    staff({ clef: 'treble', events: [{ kind: 'note', pitches: [written], value: 'semibreve' }] }),
    rng,
  );
}

function transposeNoteQuestion(rng: Rng): Question {
  const number = pick(rng, [2, 3, 4, 5, 6, 7, 8]);
  const quality = pick(rng, isPerfectType(number) ? (['perfect', 'augmented'] as const) : (['major', 'minor'] as const));
  const direction = rng() > 0.4 ? 'up' : 'down';
  let start: Pitch | null = null;
  let result: Pitch | null = null;
  for (let attempt = 0; attempt < 20 && !result; attempt += 1) {
    const candidate = pick(rng, pitchesInClef('treble', [0, 1, -1]));
    try {
      const next = transposeByInterval(candidate, { number, quality, direction });
      if (next.octave >= 3 && next.octave <= 6) {
        start = candidate;
        result = next;
      }
    } catch {
      continue;
    }
  }
  if (!start || !result) throw new Error('transpose');
  return ask(
    'transposition',
    `Transpose the printed note ${direction} a ${intervalLabel({ number, quality })}. Which note do you get?`,
    pitchName(result),
    spellingsAtMidi(toMidi(result)).map((item) => pitchName(item)).concat(LETTERS.map((letter) => letter)),
    `${pitchName(start)} moved ${direction} a ${intervalLabel({ number, quality })} is ${pitchName(result)}.`,
    staff({ clef: 'treble', events: [{ kind: 'note', pitches: [start], value: 'semibreve' }] }),
    rng,
  );
}

function clefOctaveQuestion(rng: Rng): Question {
  const shifts = [
    { delta: 0, label: 'B is the same pitch as A' },
    { delta: 12, label: 'B is one octave higher than A' },
    { delta: -12, label: 'B is one octave lower than A' },
    { delta: -24, label: 'B is two octaves lower than A' },
  ];
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const shift = pick(rng, shifts);
    const clefA = pick(rng, CLEFS);
    const clefB = pick(rng, CLEFS.filter((clef) => clef !== clefA));
    const source = pick(rng, pitchesInClef(clefA, [0, 1, -1]));
    const targetMidi = toMidi(source) + shift.delta;
    const spelled = pitch(source.letter, source.accidental, source.octave + shift.delta / 12);
    if (!Number.isInteger(spelled.octave)) continue;
    if (toMidi(spelled) !== targetMidi) continue;
    const [low, high] = CLEF_RANGE[clefB];
    if (targetMidi < low || targetMidi > high) continue;
    const options = shifts.map((item) => item.label);
    return ask(
      'transposition',
      'Compare the two notes. Which statement is true?',
      shift.label,
      options,
      `A is ${pitchName(source, true)} in the ${clefA} clef. B is ${pitchName(spelled, true)} in the ${clefB} clef. ${shift.label}. Octave transposition between clefs keeps the letter name and changes the octave.`,
      {
        systems: [
          { label: 'A', clef: clefA, events: [{ kind: 'note', pitches: [source], value: 'semibreve' }] },
          { label: 'B', clef: clefB, events: [{ kind: 'note', pitches: [spelled], value: 'semibreve' }] },
        ],
      },
      rng,
    );
  }
  throw new Error('No clef comparison');
}

function concertKeyQuestion(rng: Rng): Question {
  const instrument = pick(rng, ['Bb', 'A', 'F'] as const);
  const candidates = shuffle(rng, MAJOR_KEYS);
  for (const key of candidates) {
    const concert = transposeKey(key, TRANSPOSING_INSTRUMENTS[instrument].toConcert);
    if (!concert || concert.signature === key.signature) continue;
    return ask(
      'transposition',
      `Music for an instrument in ${TRANSPOSING_INSTRUMENTS[instrument].writtenName} is written in ${keyName(key)}. ${describeTransposition(instrument, 'to-concert')} What is the concert key?`,
      keyName(concert),
      MAJOR_KEYS.map(keyName),
      `The written tonic ${pitchName(pitch(key.tonic, key.accidental, 4))} moves ${TRANSPOSING_INSTRUMENTS[instrument].toConcert.direction} and becomes ${keyName(concert)}.`,
      staff({
        clef: 'treble',
        keySignature: vexflowKeyName(key),
        signatureCount: key.signature,
        events: [{ kind: 'rest', value: 'semibreve' }],
      }),
      rng,
    );
  }
  throw new Error('No concert key');
}

function termMeaning(rng: Rng): Question {
  const term = pick(rng, TERMS);
  return ask(
    'terms',
    `What does “${term.term}” mean?`,
    term.meaning,
    TERMS.map((item) => item.meaning),
    `${term.term} is a Grade ${term.grade} ${term.language} term meaning “${term.meaning}”.`,
    undefined,
    rng,
  );
}

function termFromMeaning(rng: Rng): Question {
  const term = pick(rng, TERMS);
  const distractors = TERMS.filter((item) => item.meaning !== term.meaning).map((item) => item.term);
  return ask(
    'terms',
    `Which term means “${term.meaning}”?`,
    term.term,
    distractors,
    `${term.term} (${term.language}, Grade ${term.grade}) means “${term.meaning}”.`,
    undefined,
    rng,
  );
}

function ornamentQuestion(rng: Rng): Question {
  const ornament = pick(rng, ORNAMENTS);
  if (ornament.pattern) {
    const start = pick(rng, [pitch('D', 0, 4), pitch('E', 0, 4), pitch('F', 0, 4), pitch('G', 0, 4)]);
    const notes = ornament.pattern.map((step) => {
      const moved = addLetterSteps(start, step);
      return pitch(moved.letter, 0, moved.octave);
    });
    return ask(
      'terms',
      'These written-out notes replace which ornament sign?',
      ornament.name,
      ORNAMENTS.map((item) => item.name),
      `A ${ornament.name} is ${ornament.definition}. The syllabus asks you to replace the written-out pattern with the sign, not the other way round.`,
      staff({
        clef: 'treble',
        events: notes.map((item) => ({ kind: 'note' as const, pitches: [item], value: 'quaver' as const })),
      }),
      rng,
    );
  }
  return ask(
    'terms',
    `Which ornament is ${ornament.definition}?`,
    ornament.name,
    ORNAMENTS.map((item) => item.name),
    `The ${ornament.name} is ${ornament.definition}.`,
    undefined,
    rng,
  );
}

function signQuestion(rng: Rng): Question {
  const sign = pick(rng, SIGNS);
  const shown = pitch('G', 0, 4);
  return ask(
    'terms',
    'What does this sign tell the player to do?',
    sign.meaning,
    SIGNS.map((item) => item.meaning).concat(['play the note an octave higher', 'repeat the bar']),
    `This is the sign for ${sign.id}. It means: ${sign.meaning}.`,
    staff({
      clef: 'treble',
      events: [{ kind: 'note', pitches: [shown], value: 'crotchet', articulation: sign.id }],
    }),
    rng,
  );
}

function instrumentFamily(rng: Rng): Question {
  const instrument = pick(rng, INSTRUMENTS);
  return ask(
    'instruments',
    `Which family does the ${instrument.name} belong to?`,
    instrument.family,
    ['strings', 'woodwind', 'brass', 'percussion', 'keyboard'],
    `The ${instrument.name} is a ${instrument.family} instrument. It produces sound by ${instrument.sound} and uses the ${instrument.clefs}.`,
    undefined,
    rng,
  );
}

function instrumentDetail(rng: Rng): Question {
  const instrument = pick(rng, INSTRUMENTS);
  const kind = pick(rng, ['sound', 'clef', 'transposition'] as const);
  if (kind === 'sound') {
    return ask(
      'instruments',
      `How does the ${instrument.name} produce its sound?`,
      instrument.sound,
      INSTRUMENTS.map((item) => item.sound),
      `The ${instrument.name} uses ${instrument.sound}.`,
      undefined,
      rng,
    );
  }
  if (kind === 'clef') {
    return ask(
      'instruments',
      `Which clef or clefs does the ${instrument.name} normally use?`,
      instrument.clefs,
      INSTRUMENTS.map((item) => item.clefs),
      `The ${instrument.name} is written in the ${instrument.clefs}.`,
      undefined,
      rng,
    );
  }
  return ask(
    'instruments',
    `How does the ${instrument.name} relate to concert pitch?`,
    instrument.transposition,
    INSTRUMENTS.map((item) => item.transposition),
    `The ${instrument.name}: ${instrument.transposition}.`,
    undefined,
    rng,
  );
}

function reedQuestion(rng: Rng): Question {
  const reeds = INSTRUMENTS.filter((item) => item.reed);
  const instrument = pick(rng, reeds);
  return ask(
    'instruments',
    `What kind of reed does the ${instrument.name} use?`,
    instrument.reed as string,
    ['single reed', 'double reed', 'air reed', 'no reed, the lips buzz'],
    `The ${instrument.name} uses a ${instrument.reed}. Clarinet is the single reed; oboe, cor anglais and bassoon are double reeds; flute and piccolo are air reeds.`,
    undefined,
    rng,
  );
}

function percussionPitch(rng: Rng): Question {
  const definite = rng() > 0.5;
  const pool = INSTRUMENTS.filter((item) => item.family === 'percussion' && item.pitch === (definite ? 'definite' : 'indefinite'));
  const instrument = pick(rng, pool);
  return ask(
    'instruments',
    `Does the ${instrument.name} have definite or indefinite pitch?`,
    instrument.pitch as string,
    ['definite', 'indefinite', 'it depends on the clef', 'only when muted'],
    `The ${instrument.name} has ${instrument.pitch} pitch. Timpani and the bar instruments are definite; side drum, bass drum, cymbals, triangle, tambourine, castanets and tam-tam are indefinite.`,
    undefined,
    rng,
  );
}

function voiceQuestion(rng: Rng): Question {
  const voice = pick(rng, VOICES);
  return ask(
    'instruments',
    `Which description matches the ${voice.name} voice?`,
    voice.description,
    VOICES.map((item) => item.description),
    `The ${voice.name} is ${voice.description}.`,
    undefined,
    rng,
  );
}

interface Passage {
  key: KeySpec;
  clef: ClefName;
  time: TimeSignatureInfo;
  notes: Pitch[];
  spec: NotationSpec;
}

function buildPassage(rng: Rng): Passage {
  const key = pick(rng, [...CADENCE_KEYS, ...MINOR_KEYS.filter((item) => Math.abs(item.signature) <= 3)]);
  const clef: ClefName = key.mode === 'minor' || rng() > 0.5 ? 'treble' : pick(rng, ['treble', 'bass'] as const);
  const time = pick(
    rng,
    TIME_SIGNATURES.filter((item) => ['2/4', '3/4', '4/4', '6/8'].includes(item.signature)),
  );
  const form = key.mode === 'minor' ? 'harmonic' : 'major';
  const degrees: DegreeNumber[] = [1, 2, 3, 4, 5, 6, 7];
  const scale = degrees
    .map((degree) => fitToClef(scaleDegree(key, degree, form), clef))
    .filter((item): item is Pitch => item !== null);
  if (scale.length < 5) throw new Error('scale does not fit');
  const count = time.signature === '6/8' ? 6 : time.signature === '3/4' ? 6 : 8;
  const value: NoteValue = time.signature === '6/8' ? 'quaver' : 'crotchet';
  const notes: Pitch[] = [];
  for (let index = 0; index < count; index += 1) notes.push(pick(rng, scale));
  const tonic = fitToClef(scaleDegree(key, 1, form), clef);
  if (tonic) notes[notes.length - 1] = tonic;
  const perBar = time.signature === '3/4' ? 3 : time.signature === '6/8' ? 6 : 4;
  const events: NotationEvent[] = notes.map((item, index) => ({
    kind: 'note',
    pitches: [item],
    value,
    barlineAfter: (index + 1) % perBar === 0 && index !== notes.length - 1,
  }));
  return {
    key,
    clef,
    time,
    notes,
    spec: staff({
      clef,
      timeSignature: time.signature,
      keySignature: vexflowKeyName(key),
      signatureCount: key.signature,
      events,
    }),
  };
}

function contextQuestion(rng: Rng): Question {
  const passage = buildPassage(rng);
  const kind = pick(rng, ['key', 'top', 'interval', 'degree', 'instrument', 'metre'] as const);
  if (kind === 'key') {
    return ask(
      'context',
      `This melody is in a ${passage.key.mode} key. Which key?`,
      keyName(passage.key),
      (passage.key.mode === 'major' ? MAJOR_KEYS : MINOR_KEYS).map(keyName),
      `The signature has ${signatureSummary(passage.key.signature)}. Because the question asks for the ${passage.key.mode}, the key is ${keyName(passage.key)}, not ${keyName(relativeKey(passage.key))}.`,
      passage.spec,
      rng,
    );
  }
  if (kind === 'top') {
    const top = [...passage.notes].sort((a, b) => toMidi(b) - toMidi(a))[0] as Pitch;
    return ask(
      'context',
      'Which is the highest note? Octave numbers use middle C as C4.',
      pitchName(top, true),
      passage.notes.map((item) => pitchName(item, true)),
      `The highest sounding note is ${pitchName(top, true)}. Compare the staff positions, not just the letter names.`,
      passage.spec,
      rng,
    );
  }
  if (kind === 'interval') {
    const first = passage.notes[0] as Pitch;
    const second = passage.notes[1] as Pitch;
    const interval = intervalBetween(first, second);
    return ask(
      'context',
      'What is the interval between the first note and the second note?',
      intervalLabel(interval),
      ['minor 2nd', 'major 2nd', 'minor 3rd', 'major 3rd', 'perfect 4th', 'perfect 5th', 'major 6th', 'perfect octave', 'diminished 5th'],
      explainInterval(first, second),
      passage.spec,
      rng,
    );
  }
  if (kind === 'degree') {
    const form = passage.key.mode === 'minor' ? 'harmonic' : 'major';
    const index = pick(rng, passage.notes.map((_, noteIndex) => noteIndex));
    const chosen = passage.notes[index] as Pitch;
    const degree = ([1, 2, 3, 4, 5, 6, 7] as const).find((item) => {
      const scaleNote = scaleDegree(passage.key, item, form);
      return scaleNote.letter === chosen.letter && scaleNote.accidental === chosen.accidental;
    });
    if (!degree) throw new Error('degree');
    return ask(
      'context',
      `Note ${index + 1} is which degree of ${keyName(passage.key)}? Count the first note as note 1.`,
      degreeName(degree),
      ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant', 'leading note'],
      `Note ${index + 1} is ${pitchName(chosen)}, the ${degreeName(degree)} of ${keyName(passage.key)}.`,
      passage.spec,
      rng,
    );
  }
  if (kind === 'metre') {
    return ask(
      'context',
      'What kind of metre is this melody in?',
      passage.time.className,
      ['simple duple', 'simple triple', 'simple quadruple', 'compound duple', 'compound triple', 'irregular'],
      `${passage.time.signature} is ${passage.time.className}: ${passage.time.grouping}.`,
      passage.spec,
      rng,
    );
  }
  const byClef: Record<ClefName, string[]> = {
    treble: ['violin', 'flute', 'oboe', 'clarinet'],
    bass: ['cello', 'bassoon', 'tuba', 'double bass'],
    alto: ['viola', 'trombone', 'cello', 'bassoon'],
    tenor: ['cello', 'bassoon', 'trombone', 'viola'],
  };
  const correct = byClef[passage.clef][0] as string;
  return ask(
    'context',
    'Which of these instruments could play the melody at the written pitch, using its usual clef?',
    correct,
    ['violin', 'viola', 'cello', 'flute', 'bassoon', 'tuba', 'horn', 'double bass'],
    `The melody is in the ${passage.clef} clef. The ${correct} regularly uses that clef. This is the sort of observation the music-in-context questions ask.`,
    passage.spec,
    rng,
  );
}

export const GENERATORS: Record<TopicId, ((rng: Rng) => Question)[]> = {
  rhythm: [meterQuestion, beatQuestion, groupingQuestion, completeBar, noteValueQuestion, tupletQuestion],
  pitch: [namePitch, enharmonicQuestion],
  keys: [
    (rng) => keySignatureQuestion(rng, 'major'),
    (rng) => keySignatureQuestion(rng, 'minor'),
    relativeQuestion,
    degreeQuestion,
    minorFormQuestion,
    chromaticQuestion,
  ],
  intervals: [intervalNameQuestion, intervalWriteQuestion],
  chords: [chordQuestion, cadenceQuestion, suitableChord],
  transposition: [
    (rng) => concertQuestion(rng, false),
    (rng) => concertQuestion(rng, true),
    transposeNoteQuestion,
    clefOctaveQuestion,
    concertKeyQuestion,
  ],
  terms: [termMeaning, termFromMeaning, ornamentQuestion, signQuestion],
  instruments: [instrumentFamily, instrumentDetail, reedQuestion, percussionPitch, voiceQuestion],
  context: [contextQuestion],
};

export function generateQuestion(topic: TopicId, rng: Rng): Question {
  let last: unknown;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      return pick(rng, GENERATORS[topic])(rng);
    } catch (error) {
      last = error;
    }
  }
  throw last instanceof Error ? last : new Error(`Could not build a ${topic} question`);
}

export function playbackFrom(spec: NotationSpec): Pitch[][] {
  const sequence: Pitch[][] = [];
  for (const system of spec.systems) {
    for (const event of system.events) {
      if (event.kind === 'note' && event.pitches && event.pitches.length > 0) sequence.push(event.pitches);
    }
  }
  return sequence;
}
