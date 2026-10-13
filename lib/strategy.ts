import type { TopicStat } from "@/lib/stats";

export const PAPER_MINUTES = 120;
export const PAPER_MARKS = 75;
export const PASS_MARK = 50;
export const MERIT_MARK = 60;
export const DISTINCTION_MARK = 65;
export const HOME_SESSION_MINUTES = 60;

export interface PassBand {
  name: string;
  range: string;
}

export const PASS_BANDS: PassBand[] = [
  { name: "Distinction", range: "65–75" },
  { name: "Merit", range: "60–64" },
  { name: "Pass", range: "50–59" },
  { name: "Below pass", range: "0–49" },
];

export interface PaperSection {
  id: string;
  title: string;
  marks: number;
  /** Suggested minutes inside the two-hour paper, including no separate review. */
  minutes: number;
  topics: string[];
  tips: string[];
}

/**
 * Grades 4–5 theory section maxima from the published qualification specification:
 * 10, 10, 15, 10, 10, 10, 10. The minute split is a study suggestion, not an official timing.
 */
export const PAPER_SECTIONS: PaperSection[] = [
  {
    id: "rhythm",
    title: "Rhythm",
    marks: 10,
    minutes: 14,
    topics: ["rhythm"],
    tips: [
      "Write the beat grouping above the bar before you add notes or rests.",
      "In 5-time and 7-time, decide 2+3 or 3+2 (and the 7-time pattern) first.",
      "A rest has to show the beats. Check the bar still adds up at the end.",
    ],
  },
  {
    id: "pitch",
    title: "Pitch and transposition",
    marks: 10,
    minutes: 14,
    topics: ["pitch", "transposition"],
    tips: [
      "For a clef you rarely read, find middle C on that staff and count letter names from there.",
      "Transposition steps: move the key signature by the given interval, then each note by letter, then check the accidentals.",
      "B♭ instruments sound a major 2nd lower than written, A instruments a minor 3rd lower, and F instruments a perfect 5th lower.",
    ],
  },
  {
    id: "keys",
    title: "Keys and scales",
    marks: 15,
    minutes: 21,
    topics: ["keys"],
    tips: [
      "Write the circle of fifths in the margin: sharps F C G D A E, flats B E A D G C.",
      "The last sharp is the leading note. The second-to-last flat names the major key.",
      "Harmonic minor raises only the 7th. Melodic minor raises 6 and 7 going up and cancels them coming down.",
    ],
  },
  {
    id: "intervals",
    title: "Intervals",
    marks: 10,
    minutes: 14,
    topics: ["intervals"],
    tips: [
      "Count letter names for the number, then compare the size with the major scale of the lower note.",
      "A compound interval is the simple one plus an octave: a 9th is a 2nd, a 10th is a 3rd.",
      "Inverted intervals add to 9. Major swaps with minor, augmented with diminished, perfect stays perfect.",
    ],
  },
  {
    id: "chords",
    title: "Triads and chords",
    marks: 10,
    minutes: 14,
    topics: ["chords"],
    tips: [
      "Cadence checklist: V–I perfect, IV–I plagal, anything that ends on V is imperfect.",
      "Name the bass note before the inversion. Root in the bass is root position; 3rd in the bass is first inversion.",
      "In a minor key, raise the leading note so chord V is major.",
    ],
  },
  {
    id: "terms",
    title: "Terms, signs and instruments",
    marks: 10,
    minutes: 14,
    topics: ["terms", "ornaments"],
    tips: [
      "Sort the word by language first, then decide whether it is speed, a change of speed, or mood.",
      "A trill stays on the note and the note above. A mordent is one quick dip. A turn uses the note below as well.",
      "An acciaccatura has a slash and is crushed. An appoggiatura has no slash and takes half the main note, or two-thirds if that note is dotted.",
    ],
  },
  {
    id: "context",
    title: "Music in context",
    marks: 10,
    minutes: 14,
    topics: ["context"],
    tips: [
      "Name the clef, the family, and how the sound is made before you choose.",
      "Texture: one line is monophonic, tune plus accompaniment is homophonic, independent lines are polyphonic.",
      "A string quartet is two violins, viola and cello. The viola is the one in the alto clef.",
    ],
  },
];

export interface StudySlot {
  id: string;
  title: string;
  marks: number;
  minutes: number;
  topics: string[];
  reason: string;
}

function worstAccuracy(section: PaperSection, stats: TopicStat[]): number | null {
  const related = section.topics.map((topic) => stats.find((item) => item.topic === topic));
  const attempted = related.filter((item) => item && item.attempted > 0) as TopicStat[];
  if (attempted.length === 0) return null;
  return Math.min(...attempted.map((item) => item.accuracy));
}

function reasonFor(section: PaperSection, worst: number | null, anyAttempt: boolean): string {
  if (!anyAttempt) {
    return section.marks === 15
      ? "No results yet. This section is worth 15 marks, so it gets the longest block."
      : "No results yet. Time follows the 10 marks this section carries.";
  }
  if (worst === null) {
    return "Not tried yet, so this keeps a share of the hour. Missed sections get more.";
  }
  if (worst < 50) return "Your latest results here are under 50%. This block is deliberately longer.";
  if (worst < 80) return "This is started, and it is not secure yet.";
  return "This looks secure. A short recap is enough.";
}

/** A 60-minute practice plan. Section marks set the base; weak topics get a larger share. */
export function studyPlan(stats: TopicStat[]): StudySlot[] {
  const anyAttempt = stats.some((item) => item.attempted > 0);
  const weights = PAPER_SECTIONS.map((section) => {
    const worst = worstAccuracy(section, stats);
    let multiplier = 1;
    if (anyAttempt) {
      if (worst !== null && worst < 50) multiplier = 1.8;
      else if (worst === null) multiplier = 1.15;
      else if (worst < 80) multiplier = 1.35;
      else multiplier = 0.65;
    }
    return { section, worst, weight: section.marks * multiplier };
  });
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  const raw = weights.map((item) => (item.weight / totalWeight) * HOME_SESSION_MINUTES);
  const minutes = raw.map((value) => Math.floor(value));
  let spare = HOME_SESSION_MINUTES - minutes.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);
  for (const item of order) {
    if (spare <= 0) break;
    minutes[item.index] = (minutes[item.index] ?? 0) + 1;
    spare -= 1;
  }
  return weights.map((item, index) => ({
    id: item.section.id,
    title: item.section.title,
    marks: item.section.marks,
    minutes: minutes[index] ?? 0,
    topics: item.section.topics,
    reason: reasonFor(item.section, item.worst, anyAttempt),
  }));
}
