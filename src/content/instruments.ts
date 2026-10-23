export interface InstrumentFact {
  name: string;
  family: 'strings' | 'woodwind' | 'brass' | 'percussion' | 'keyboard';
  clefs: string;
  sound: string;
  transposition: string;
  pitch?: 'definite' | 'indefinite';
  reed?: 'single reed' | 'double reed' | 'air reed';
}

/** Instruments named in the Grade 4–5 syllabus, with the clef, family and sound production a Grade 5 candidate is expected to know. */
export const INSTRUMENTS: InstrumentFact[] = [
  { name: 'violin', family: 'strings', clefs: 'treble clef', sound: 'bowed or plucked strings', transposition: 'non-transposing' },
  { name: 'viola', family: 'strings', clefs: 'alto clef', sound: 'bowed or plucked strings', transposition: 'non-transposing' },
  { name: 'cello', family: 'strings', clefs: 'bass clef, and tenor clef for higher passages', sound: 'bowed or plucked strings', transposition: 'non-transposing' },
  { name: 'double bass', family: 'strings', clefs: 'bass clef', sound: 'bowed or plucked strings', transposition: 'sounds an octave lower than written' },
  { name: 'harp', family: 'strings', clefs: 'treble and bass clefs', sound: 'plucked strings', transposition: 'non-transposing' },
  { name: 'flute', family: 'woodwind', clefs: 'treble clef', sound: 'air blown across an edge', transposition: 'non-transposing', reed: 'air reed' },
  { name: 'piccolo', family: 'woodwind', clefs: 'treble clef', sound: 'air blown across an edge', transposition: 'sounds an octave higher than written', reed: 'air reed' },
  { name: 'oboe', family: 'woodwind', clefs: 'treble clef', sound: 'a double reed', transposition: 'non-transposing', reed: 'double reed' },
  { name: 'cor anglais', family: 'woodwind', clefs: 'treble clef', sound: 'a double reed', transposition: 'in F: sounds a perfect 5th lower than written', reed: 'double reed' },
  { name: 'clarinet', family: 'woodwind', clefs: 'treble clef', sound: 'a single reed', transposition: 'usually in B♭ or A: sounds lower than written', reed: 'single reed' },
  { name: 'bassoon', family: 'woodwind', clefs: 'bass clef and tenor clef', sound: 'a double reed', transposition: 'non-transposing', reed: 'double reed' },
  { name: 'trumpet', family: 'brass', clefs: 'treble clef', sound: 'buzzing lips into a mouthpiece', transposition: 'usually in B♭: sounds a major 2nd lower than written' },
  { name: 'horn', family: 'brass', clefs: 'treble clef', sound: 'buzzing lips into a mouthpiece', transposition: 'in F: sounds a perfect 5th lower than written' },
  { name: 'trombone', family: 'brass', clefs: 'tenor clef and bass clef', sound: 'buzzing lips into a mouthpiece', transposition: 'non-transposing' },
  { name: 'tuba', family: 'brass', clefs: 'bass clef', sound: 'buzzing lips into a mouthpiece', transposition: 'non-transposing' },
  { name: 'timpani', family: 'percussion', clefs: 'bass clef', sound: 'a struck membrane', transposition: 'non-transposing', pitch: 'definite' },
  { name: 'side drum', family: 'percussion', clefs: 'percussion clef', sound: 'a struck membrane', transposition: 'non-transposing', pitch: 'indefinite' },
  { name: 'bass drum', family: 'percussion', clefs: 'percussion clef', sound: 'a struck membrane', transposition: 'non-transposing', pitch: 'indefinite' },
  { name: 'cymbals', family: 'percussion', clefs: 'percussion clef', sound: 'struck metal plates', transposition: 'non-transposing', pitch: 'indefinite' },
  { name: 'triangle', family: 'percussion', clefs: 'percussion clef', sound: 'a struck metal bar', transposition: 'non-transposing', pitch: 'indefinite' },
  { name: 'tambourine', family: 'percussion', clefs: 'percussion clef', sound: 'a shaken or struck membrane with jingles', transposition: 'non-transposing', pitch: 'indefinite' },
  { name: 'castanets', family: 'percussion', clefs: 'percussion clef', sound: 'clapped wooden shells', transposition: 'non-transposing', pitch: 'indefinite' },
  { name: 'tam-tam', family: 'percussion', clefs: 'percussion clef', sound: 'a struck metal gong', transposition: 'non-transposing', pitch: 'indefinite' },
  { name: 'xylophone', family: 'percussion', clefs: 'treble clef', sound: 'struck wooden bars', transposition: 'non-transposing', pitch: 'definite' },
  { name: 'marimba', family: 'percussion', clefs: 'treble and bass clefs', sound: 'struck wooden bars', transposition: 'non-transposing', pitch: 'definite' },
  { name: 'glockenspiel', family: 'percussion', clefs: 'treble clef', sound: 'struck metal bars', transposition: 'non-transposing', pitch: 'definite' },
  { name: 'vibraphone', family: 'percussion', clefs: 'treble clef', sound: 'struck metal bars', transposition: 'non-transposing', pitch: 'definite' },
  { name: 'celesta', family: 'percussion', clefs: 'treble and bass clefs', sound: 'hammers striking metal bars', transposition: 'non-transposing', pitch: 'definite' },
  { name: 'tubular bells', family: 'percussion', clefs: 'treble clef', sound: 'struck metal tubes', transposition: 'non-transposing', pitch: 'definite' },
  { name: 'piano', family: 'keyboard', clefs: 'treble and bass clefs', sound: 'hammers striking strings', transposition: 'non-transposing' },
];

export const VOICES = [
  { name: 'soprano', description: 'the highest standard voice, usually written in the treble clef' },
  { name: 'mezzo-soprano', description: 'a medium-high voice, usually written in the treble clef' },
  { name: 'alto', description: 'a lower female or unchanged voice, usually written in the treble clef' },
  { name: 'tenor', description: 'a high male voice, often written in the treble clef sounding an octave lower' },
  { name: 'baritone', description: 'a medium male voice, usually written in the bass clef' },
  { name: 'bass', description: 'the lowest standard voice, written in the bass clef' },
] as const;
