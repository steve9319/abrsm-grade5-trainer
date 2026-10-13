import { TOPIC_IDS, type TopicId } from "@/lib/types";

export interface TopicMeta {
  id: TopicId;
  title: string;
  blurb: string;
  syllabus: string;
}

export const TOPICS: TopicMeta[] = [
  {
    id: "rhythm",
    title: "Rhythm & time",
    blurb: "Simple, compound and irregular metres, grouping, triplets and duplets.",
    syllabus:
      "Time signatures including 5/4, 7/4, 5/8 and 7/8, grouping of notes and rests, and irregular divisions such as triplets and duplets.",
  },
  {
    id: "pitch",
    title: "Pitch & clefs",
    blurb: "Treble, bass, alto and tenor clefs, including ledger lines.",
    syllabus:
      "Reading and writing notes in the treble, bass, alto and tenor clefs, in the keys set for Grade 5.",
  },
  {
    id: "keys",
    title: "Keys & scales",
    blurb: "Major and minor keys up to six sharps or flats, and the technical names of notes.",
    syllabus:
      "Major, harmonic minor and melodic minor scales and key signatures up to six sharps and six flats, relative keys, and technical names from tonic to leading note.",
  },
  {
    id: "intervals",
    title: "Intervals",
    blurb: "Simple and compound intervals: quality, number and inversion.",
    syllabus:
      "All simple and compound intervals from any note, including major, minor, perfect, augmented and diminished, and how intervals invert.",
  },
  {
    id: "chords",
    title: "Chords & cadences",
    blurb: "I, ii, IV and V in root position and inversions, and the common cadences.",
    syllabus:
      "Root position, first inversion and second inversion of the tonic, supertonic, subdominant and dominant triads, the cadential 6/4, and perfect, plagal and imperfect cadences in C, G, D and F major.",
  },
  {
    id: "transposition",
    title: "Transposition",
    blurb: "Moves between clefs, and concert pitch for instruments in B♭, A and F.",
    syllabus:
      "Transposition at the octave from one clef to another, and writing a short melody at concert pitch for an instrument in B♭, A or F (and the reverse). The interval is given.",
  },
  {
    id: "terms",
    title: "Terms & signs",
    blurb: "Italian, French and German words you are expected to know by Grade 5.",
    syllabus:
      "Performance directions accumulated from Grades 1–5, including Italian, French and German terms for tempo, mood and articulation.",
  },
  {
    id: "ornaments",
    title: "Ornaments",
    blurb: "Match a written-out figure to the ornament it realises.",
    syllabus:
      "Recognising trills, mordents, turns, appoggiaturas and acciaccaturas, including replacing a written-out ornament with the right sign.",
  },
  {
    id: "context",
    title: "Music in context",
    blurb: "Voices, instruments, families, and how the theory sits inside real music.",
    syllabus:
      "Names and clefs of voices and instruments, families and how they produce sound, and straightforward observation of a musical passage.",
  },
  {
    id: "practical",
    title: "Piano practical",
    blurb: "Grade 5 aural and sight-reading ideas for the practical exam.",
    syllabus:
      "Not part of the theory paper. Cadences and modulations from the Grade 5 aural tests, and what to look for in Grade 5 piano sight-reading.",
  },
];

const TOPIC_SET = new Set<string>(TOPIC_IDS);

export function isTopicId(value: string): value is TopicId {
  return TOPIC_SET.has(value);
}

export function topicMeta(id: string): TopicMeta | undefined {
  return TOPICS.find((topic) => topic.id === id);
}
