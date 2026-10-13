import { topicMeta } from "@/lib/topics";

export interface Concept {
  topic: string;
  id: string;
  title: string;
  lesson: string;
}

/**
 * Short original lessons used when Claude is unavailable.
 * They describe method, not text from any practice paper.
 */
export const CONCEPTS: Concept[] = [
  {
    topic: "rhythm",
    id: "compound-time",
    title: "Compound time",
    lesson:
      "In compound time the beat divides into three, not two. 6/8 and 6/4 have two dotted beats, 9/8 has three, and 12/8 has four. The top number counts the divisions, so divide it by three to find the number of beats. Group notes and rests into those dotted beats before you choose an answer.",
  },
  {
    topic: "rhythm",
    id: "tuplets",
    title: "Triplets and duplets",
    lesson:
      "A triplet squeezes three equal notes into the time of two of the same kind. A duplet squeezes two into the time of three, which is why duplets turn up in compound time. Read the bracket number first, then check the time signature: a triplet in 2/4 is not the same pattern as a beat of 6/8.",
  },
  {
    topic: "rhythm",
    id: "irregular-time",
    title: "Irregular metres",
    lesson:
      "5/4, 5/8, 7/4 and 7/8 mix beats of two and three. Write the grouping above the bar before you add notes or rests: 5 is usually 3+2 or 2+3, and 7 is often 2+2+3 or 3+2+2. The question is usually asking for that grouping, not for a new time signature.",
  },
  {
    topic: "rhythm",
    id: "rests",
    title: "Rests and grouping",
    lesson:
      "A rest must show the beats, not just add up to the right number of crotchets. In simple time, finish each beat before you start the next. In compound time, a whole dotted beat can be one dotted rest, but a rest that crosses the middle of the beat needs to be split. Check the last bar still adds up.",
  },
  {
    topic: "pitch",
    id: "alto-clef",
    title: "Alto clef",
    lesson:
      "The alto clef puts middle C on the middle line. Two ledger lines above the staff is not the same note as in the treble. Find middle C first, then count letter names up or down. The viola reads this clef, which is the usual clue in an instrument question.",
  },
  {
    topic: "pitch",
    id: "tenor-clef",
    title: "Tenor clef",
    lesson:
      "The tenor clef puts middle C on the second line down. It sits a little higher on the staff than the alto clef, so the same line is a different note. Name middle C, then step by letter. Cello, bassoon and trombone use it when the music sits high for the bass clef.",
  },
  {
    topic: "pitch",
    id: "bass-clef",
    title: "Bass clef",
    lesson:
      "The bass clef names the fourth line F. Middle C is one ledger line above the staff. Count spaces and lines by letter, and keep the key signature's accidentals in mind before you name the note. Piano left hand, cello, bassoon and the bass voice all use this clef.",
  },
  {
    topic: "pitch",
    id: "ledger-lines",
    title: "Ledger lines",
    lesson:
      "Ledger lines continue the staff one note at a time. Count them from the nearest staff line, not from memory of a shape. Middle C is one ledger line below the treble and one above the bass. In alto and tenor, start from the C line of that clef so you do not import treble habits.",
  },
  {
    topic: "keys",
    id: "key-signatures",
    title: "Key signatures",
    lesson:
      "Write the circle of fifths in the margin before this section. Sharp order is F C G D A E; flat order is B E A D G C. The last sharp is the leading note of the major key, so the key is one semitone higher. The second-to-last flat is the major key itself. Up to six sharps or flats is in grade.",
  },
  {
    topic: "keys",
    id: "relative-keys",
    title: "Relative keys",
    lesson:
      "Relative major and minor share a key signature. The relative minor is a minor 3rd, three semitones, below the major tonic. The relative major is a minor 3rd above the minor tonic. Name the signature first, then move that minor 3rd. Do not add or remove an accidental for the relative key itself.",
  },
  {
    topic: "keys",
    id: "technical-names",
    title: "Technical names",
    lesson:
      "The seven names, in order, are tonic, supertonic, mediant, subdominant, dominant, submediant and leading note. They count scale degrees, not letter names, so degree 4 of D major is G, not the subdominant of C. In a minor key, use the key signature of that minor key before you count.",
  },
  {
    topic: "keys",
    id: "minor-scales",
    title: "Minor scales",
    lesson:
      "Harmonic minor raises only the 7th, which leaves an augmented 2nd between the 6th and 7th. Melodic minor raises the 6th and 7th on the way up, then cancels those raises on the way down so the descent matches the key signature. The key signature itself never includes the raised 7th.",
  },
  {
    topic: "intervals",
    id: "naming",
    title: "Naming intervals",
    lesson:
      "Count letter names first, including both ends: that is the number. Then judge the quality against the major scale of the lower note. Major and perfect shrink to minor and diminished by one semitone; they grow to augmented by one semitone. If the lower note is not the tonic you expected, rewrite the major scale before you guess.",
  },
  {
    topic: "intervals",
    id: "inversion",
    title: "Inverting intervals",
    lesson:
      "Turn the lower note up an octave, or the upper note down an octave. The two numbers add to 9: a 2nd inverts to a 7th, a 3rd to a 6th, a 4th to a 5th. Major swaps with minor, augmented swaps with diminished, and perfect stays perfect. Reduce a compound interval to its simple form before you invert it.",
  },
  {
    topic: "intervals",
    id: "compound",
    title: "Compound intervals",
    lesson:
      "A compound interval is wider than an octave. Subtract 7 to find the simple interval: a 9th is a 2nd, a 10th is a 3rd, an 11th is a 4th. The quality stays the same as that simple interval. Count letter names across the octave carefully so you do not stop one short.",
  },
  {
    topic: "intervals",
    id: "harmonic-minor",
    title: "Intervals in the harmonic minor",
    lesson:
      "The harmonic minor raises the 7th degree. That raised leading note makes a minor 2nd up to the tonic, and it makes an augmented 2nd with the 6th degree. When both notes of an interval sit in a minor key, apply the key signature and then the raised 7th before you name the quality.",
  },
  {
    topic: "chords",
    id: "triads",
    title: "Primary triads",
    lesson:
      "Build I, ii, IV and V from the scale of the key. In a major key, I, IV and V are major and ii is minor. Stack the notes in thirds from the root, then name the chord from its root even if the question prints it in close position. Check the key signature before you add accidentals.",
  },
  {
    topic: "chords",
    id: "inversions",
    title: "Chord inversions",
    lesson:
      "Root position puts the root lowest. First inversion puts the 3rd lowest (chord 6). Second inversion puts the 5th lowest (chord 6/4). Find the root by rearranging the notes into a stack of thirds, then see which chord tone is in the bass. A cadential 6/4 is Ic moving to V, not a new chord family.",
  },
  {
    topic: "chords",
    id: "cadences",
    title: "Cadences",
    lesson:
      "Name the two chords, then use a checklist. V–I is perfect. IV–I is plagal. A cadence that ends on V (I–V, ii–V or IV–V) is imperfect. The last chord decides an imperfect cadence; the chord before it only tells you which approach. Ignore the melody rhythm until the bass notes are named.",
  },
  {
    topic: "chords",
    id: "minor-key-chords",
    title: "Chords in minor keys",
    lesson:
      "A minor key uses its key signature, and chord V needs the raised leading note so the dominant triad is major. Chord iv is minor if it follows the key signature. If you forget the raised 7th, V becomes minor and no longer behaves as a dominant. Write the leading note in before you label the cadence.",
  },
  {
    topic: "transposition",
    id: "by-interval",
    title: "Transposing by a given interval",
    lesson:
      "The question names the interval and the direction. Transpose the key signature by that same interval first, then each note by letter name, then check that accidentals still make the same quality of interval. Sing or count one bar. If the new key signature already supplies an accidental, do not write it again on the note.",
  },
  {
    topic: "transposition",
    id: "clarinet-bb",
    title: "Clarinet in B♭",
    lesson:
      "A B♭ instrument sounds a major 2nd lower than written. Written C sounds B♭. To rewrite a B♭ part at concert pitch, transpose down a major 2nd. To write a concert-pitch tune for the instrument, transpose up a major 2nd. Do the key signature as part of that same major 2nd.",
  },
  {
    topic: "transposition",
    id: "horn-f",
    title: "Horn in F",
    lesson:
      "An instrument in F sounds a perfect 5th lower than written. Written C sounds F. Concert pitch is down a perfect 5th from the written part; the written part is up a perfect 5th from concert pitch. Move the key signature by that perfect 5th and then check one note in the bar.",
  },
  {
    topic: "transposition",
    id: "clarinet-a",
    title: "Clarinet in A",
    lesson:
      "An instrument in A sounds a minor 3rd lower than written. Written C sounds A. Down a minor 3rd gives concert pitch; up a minor 3rd writes the part. A minor 3rd is three semitones, which is also the distance between relative major and minor, but here you are moving the notes, not renaming the key.",
  },
  {
    topic: "transposition",
    id: "octave-clefs",
    title: "Octave transposition and clefs",
    lesson:
      "An octave transposition keeps the letter names and changes the clef or the register. Treble to bass at the octave is not the same as a 2nd or a 5th. Copy the contour and the rhythms exactly, then check that each note is one octave from the original, on the staff the question asked for.",
  },
  {
    topic: "terms",
    id: "italian",
    title: "Italian terms",
    lesson:
      "Most tempo words are Italian. Sort them into speed, a change of speed, and mood. Pairs that get swapped are the near neighbours: a word ending in -etto or -ino is a lighter version, and a word starting ri- often means again. Read the whole word against the sentence in the question, not the first syllable.",
  },
  {
    topic: "terms",
    id: "german",
    title: "German terms",
    lesson:
      "German directions often join a mood to a speed in one capitalised word. Translate the whole word. Do not stop at a familiar syllable. If two options share a first half, the second half is the part that decides the answer. Keep a short personal list of the ones you mix up and add one line each time you miss one.",
  },
  {
    topic: "terms",
    id: "french",
    title: "French terms",
    lesson:
      "French terms at this grade are fewer, so they are easy to rush. Decide whether the word is about speed, a hold, or a style of playing. Words that look like English are not always the same idea. If you are unsure, eliminate the Italian and German options that you do know, then match the French word to the remaining meaning.",
  },
  {
    topic: "ornaments",
    id: "trill",
    title: "Trills",
    lesson:
      "A trill is a rapid alternation of the written note and the note above. Match the sign to a written-out figure that keeps returning to those two neighbours. A turn has a note below as well; a mordent is only one quick dip. If the figure is a long chain of the note and its upper neighbour, it is the trill.",
  },
  {
    topic: "ornaments",
    id: "mordent",
    title: "Mordents",
    lesson:
      "A mordent is a single quick alternation, not a long trill. The ordinary mordent uses the note above. The lower mordent, printed with a short vertical stroke through the sign, uses the note below. Look at the first neighbouring note in the written-out figure: above means one sign, below means the other.",
  },
  {
    topic: "ornaments",
    id: "turn",
    title: "Turns",
    lesson:
      "A turn winds around the written note: the note above, the main note, the note below, and the main note again. An inverted turn starts with the note below. The sign after a dotted note usually sits between the note and its dot, so the figure comes after the main note has been heard. Count four notes in the figure before you pick the sign.",
  },
  {
    topic: "ornaments",
    id: "grace-notes",
    title: "Grace notes",
    lesson:
      "An acciaccatura is the small note with a slash through the stem. It is crushed in, as short as possible. An appoggiatura has no slash and takes time from the main note: half of an ordinary note, or two-thirds when the main note is dotted. If the option is about length rather than shape, look for the slash first.",
  },
  {
    topic: "context",
    id: "ensembles",
    title: "Ensembles",
    lesson:
      "Name the standard group before you look for the odd one out. A string quartet is two violins, viola and cello. A string orchestra has no wind. Woodwind and brass choirs stay inside their families. If one instrument needs a different clef family or a different way of making sound, it is usually the intruder.",
  },
  {
    topic: "context",
    id: "clefs-and-instruments",
    title: "Clefs and instruments",
    lesson:
      "Pair the instrument with the clef it actually reads. Violin, flute, oboe, clarinet and trumpet use the treble. Viola uses the alto. Cello, bassoon and trombone use the bass, and the tenor clef when they sit high. Do not give the viola the treble clef just because it is a string instrument.",
  },
  {
    topic: "context",
    id: "sound-production",
    title: "How instruments make sound",
    lesson:
      "Sort the instrument by the action: bowed or plucked strings, blown woodwind or brass, and struck percussion. A harp is plucked, not bowed. A saxophone is a reed instrument even though it is made of metal. The family name follows how the sound is made, not the material you notice first.",
  },
  {
    topic: "context",
    id: "periods",
    title: "Periods and styles",
    lesson:
      "Use the broad periods as labels, not as a biography test. Baroque writing often has a continuo and spinning lines. Classical phrases tend to be balanced in twos and fours. Romantic writing is more likely to push the harmony and the expression marks. Match the clue in the question to one of those habits.",
  },
  {
    topic: "context",
    id: "texture",
    title: "Texture",
    lesson:
      "Monophonic is one line, even if several people sing it in unison. Homophonic is a tune with accompaniment, including a melody over chords. Polyphonic means independent lines at the same time. Decide how many different tunes you can hear, then pick the word. A chordal piano part under a song is homophonic, not polyphonic.",
  },
  {
    topic: "context",
    id: "voices",
    title: "Voices",
    lesson:
      "The four main types are soprano, alto, tenor and bass. Soprano and alto are usually written in the treble clef, bass in the bass clef, and tenor either in the treble clef sounding down an octave or in the tenor clef. If a question names a range, compare it with middle C before you choose the voice.",
  },
  {
    topic: "practical",
    id: "aural-cadences",
    title: "Aural cadences",
    lesson:
      "This is for the practical exam, not the theory paper. A perfect cadence comes to rest: you hear V then I. An imperfect cadence stops on V and wants to continue. A plagal cadence is the softer IV–I. Hum the last two bass notes. If the second one feels finished on the home note, it is not imperfect.",
  },
  {
    topic: "practical",
    id: "modulation",
    title: "Modulation",
    lesson:
      "A modulation to the dominant adds one sharp or takes away one flat. A move to the relative key keeps the same signature and changes mode. Listen for the new leading note, which is the raised 7th of the key you have arrived in. Name the old key, then the new one, before you describe the relationship.",
  },
  {
    topic: "practical",
    id: "sight-reading",
    title: "Sight-reading",
    lesson:
      "Before you play, name the key signature, the time signature, and any accidental that returns. Find the bar with the largest leap or the densest rhythm and finger that one quietly. Keep the pulse even if a note is wrong. This set is piano practical preparation; it is not one of the seven theory sections.",
  },
];

export function findConcept(topic: string, subtopic: string): Concept | undefined {
  return CONCEPTS.find((concept) => concept.topic === topic && concept.id === subtopic);
}

export function conceptTitle(topic: string, subtopic: string): string {
  return findConcept(topic, subtopic)?.title ?? subtopic.replace(/-/g, " ");
}

export function fallbackLesson(topic: string, subtopic: string): string {
  const known = findConcept(topic, subtopic);
  if (known) return known.lesson;
  const topicTitle = topicMeta(topic)?.title ?? topic;
  const name = conceptTitle(topic, subtopic);
  return `${name} sits inside ${topicTitle}. Name the key or the metre before you look at the options, then test each option against one rule. When you miss one, write that rule in your own words before the next question.`;
}
