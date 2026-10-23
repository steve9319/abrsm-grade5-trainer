# Grade 5 Theory Room

A personal practice app for the [ABRSM Grade 5 Music Theory](https://www.abrsm.org/en-gb/music-theory) exam, the online paper based on the syllabus introduced in 2020 (still the current Grades 1–5 specification). Questions are generated from that syllabus, drawn as notation, and marked at once. Progress stays in the browser.

It is a study tool, not an ABRSM product and not a replica of the exam software.

## What you can practise

The home screen follows the seven sections of the Grade 5 paper, split a little finer so you can drill one skill at a time:

| Practice | Syllabus ground |
| --- | --- |
| Rhythm | Simple, compound and irregular metres, including 5/4, 7/4, 5/8 and 7/8. Note values from the breve to the demisemiquaver, dots, rests, grouping, duplets, triplets, quintuplets and sextuplets. British and American names. |
| Pitch and clefs | Treble, bass, alto and tenor, including enharmonics and double sharps and flats. |
| Keys and scales | Major and minor keys up to six sharps or flats, relative keys, technical names, harmonic and melodic minor, chromatic spelling. |
| Intervals | Diminished, minor, perfect, major and augmented intervals, simple and compound, above or below a note. |
| Chords and cadences | Chords I, II, IV and V in root position (a), first inversion (b) and second inversion (c). Minor keys use the harmonic form, so V is major. Perfect, plagal and imperfect cadences in C, G, D and F major. |
| Transposition | By interval, by octave between clefs, and for instruments in B♭, A and F. The interval is stated in the question, as it is in the exam. |
| Terms and signs | The Italian, French and German terms and the signs in the Grades 1–5 list, plus ornaments. Written-out patterns are matched to the sign, which is the direction the Grade 5 paper asks. |
| Instruments and voices | Family, clef, how the sound is made, reed type, transposing instruments, definite or indefinite pitch, and the standard voices. |
| Music in context | A short generated melody with questions about key, metre, interval, degree and a likely instrument. |

**Mixed mock** walks the same seven sections in exam order (21 questions, not timed). The result uses the real Grade 5 boundaries as percentages: pass 50/75, merit 60/75, distinction 65/75.

A second person can use **Add learner**. Each name keeps its own accuracy and mock history in `localStorage` on that device.

Notation is drawn with [VexFlow](https://github.com/vexflow/vexflow). **Play** sounds the printed notes with the browser’s audio engine.

## Run it locally

You need Node.js 20 or newer.

```bash
npm install
npm test
npm run dev
```

Open the address Vite prints (usually http://localhost:5173).

`npm test` checks the theory engine (intervals, key signatures, scales, chords, transposition, rhythm totals, chromatic spelling) and checks that every topic can generate a full set of valid questions. `npm run build` typechecks and writes a static site to `dist/`.

## Deploy on Vercel

The app is a static Vite site. There is no server and no environment variables.

1. Push this repository to GitHub.
2. In Vercel, choose **Add New… → Project** and import the repository.
3. Vercel should detect Vite. If it asks:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
4. Deploy. Later pushes to the production branch deploy again.

`vercel.json` records those build settings. Client navigation does not use URL routes, so the site does not need a rewrite rule.

## Syllabus notes and simplifications

Checked against ABRSM’s *Music Theory Grades qualification specification* (rebranded 2023, content from 2020) and the Grade 5 sample paper. Grade 5 assumes Grades 1–4 as well. These are the deliberate limits of this first version:

- Answers are multiple choice. The online exam also uses tick boxes and true/false, but some items ask you to write a note, a rest or a chord label onto the stave. This app asks for the same musical decision and shows the notation, without a freehand notation editor.
- Beaming is practised as “how is this metre grouped?”, not as “rewrite this bar with the correct beams”.
- Ornaments: you name the sign, or match a written-out pattern to the sign. You are not asked to draw the symbol. The syllabus does not ask you to realise a sign as notes at this grade.
- Cadence practice recognises perfect, plagal and imperfect cadences and chooses the chord that completes one. It does not ask you to write a full row of Roman numerals under a long melody. The interrupted cadence is only a wrong answer: in this syllabus it is assessed from Grade 6.
- Music in context uses short generated melodies, not an extract from a published score.
- The mock is a section-by-section drill, not a two-hour 75-mark paper.
- Chromatic-scale questions use one consistent melodic spelling (semitone steps, the same note at both ends, no letter more than twice before the final note, sharps ascending and flats descending). ABRSM accepts any spelling that follows those constraints, not only one house style.
- Instrument questions use the instruments and voice-types named for Grades 4 and 5, with the usual clef and a broad description of range and sound. They do not ask for exact sounding ranges in ledger lines.

Not in Grade 5, so not in the app: figured bass, the dominant seventh, modulation, and melody composition. Those belong to Grades 6–8.
