# Grade 5 Theory

An unofficial practice room for the ABRSM Grade 5 Music Theory paper, built for piano students who need the written exam before Grade 6 practical. Questions cover rhythm and time, pitch and clefs, keys and scales up to six sharps or flats, intervals, chords and cadences, transposition (including instruments in B♭, A and F), Italian, French and German terms, ornaments, and music in context. A short extra set covers Grade 5 aural and sight-reading ideas. That set is for the practical exam, so the timed mock leaves it out.

This project is not affiliated with ABRSM. The questions in `data/questions` are original, written in the style of the paper. Do not commit verbatim text from ABRSM or other publishers' papers to a public repository. If you own a paper and want a private reminder of where an idea came from, put a citation in `source` (for example `ABRSM 2023 Paper A Q3`) and write the question in your own words.

## Local development

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run build
```

`npm test` checks every question file against the schema. `npm run build` is the Next.js production build used on Vercel.

The app stores progress, mock results and any generated explanations in `localStorage` on the device. Nothing is sent to a server unless a question is missing an explanation and `ANTHROPIC_API_KEY` is set.

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, import the repository. The framework preset is Next.js. Leave the install and build commands as `npm install` and `npm run build`.
3. Optional: in Project Settings → Environment Variables, set `ANTHROPIC_API_KEY` to an Anthropic API key. Set `ANTHROPIC_MODEL` only if you want a model other than the default.
4. Deploy.

Without the key, practice and the mock still work. A question that has no written explanation shows **explanation unavailable**.

Copy `.env.example` to `.env.local` for the same variables on your machine. Never commit a real key.

## How practice works

- **Practise by topic** opens one syllabus area. Choose an option, then check it. The screen shows the correct answer, why it is correct, and why each other option is wrong.
- **Mixed practice** walks through the whole bank.
- **Mock paper** is 18 questions (two from each theory topic) and 30 minutes. You can move between questions. Marking waits until you submit, or until the clock runs out. The real Grade 5 theory exam is longer (about two hours); this is a shorter rehearsal.
- **Progress** keeps the latest result for each question, the weakest topics, and past papers. Clearing it only affects this browser.

## Adding questions

Drop a JSON file in `data/questions`, or merge a CSV or JSON file with the importer:

```bash
npm run import-questions -- data/examples/question.json --dry-run
npm run import-questions -- data/examples/question.csv
npm run import-questions -- path/to/more.json --replace
```

New ids are appended to `data/questions/imported.json`. `--replace` overwrites an id that is already in the bank. `--allow-missing-explanations` accepts drafts with blank explanations so the app can ask Claude to fill them in; `npm test` still fails until every option is explained.

Then run `npm test` and `npm run validate`.

### Schema

Each file in `data/questions` is a JSON array. One question looks like this:

```json
{
  "id": "intervals-01",
  "topic": "intervals",
  "source": "original",
  "question": "What is the melodic interval from the first note up to the second?",
  "notation": "X:1\nM:2/4\nL:1/4\nK:C\nC A |",
  "notationAlt": "Treble staff, no sharps or flats. Two crotchets.",
  "options": [
    { "id": "A", "text": "Minor 6th", "explanation": "Why this option is wrong." },
    { "id": "B", "text": "Major 6th", "explanation": "Why this option is right." },
    { "id": "C", "text": "Perfect 5th", "explanation": "Why this option is wrong." },
    { "id": "D", "text": "Minor 7th", "explanation": "Why this option is wrong." }
  ],
  "correctAnswer": "B",
  "explanation": "Why the correct answer is correct."
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Unique slug, letters, numbers and hyphens. |
| `topic` | yes | One of `rhythm`, `pitch`, `keys`, `intervals`, `chords`, `transposition`, `terms`, `ornaments`, `context`, `practical`. Add a new id in `lib/topics.ts` before using it. |
| `source` | yes | `original`, or your own citation such as `ABRSM 2023 Paper A Q3`. |
| `question` | yes | The stem. |
| `notation` | no | [ABC notation](https://abcnotation.com/), rendered in the browser with abcjs. In CSV, write line breaks as `\n`. |
| `notationAlt` | no | A short description of the staff for screen readers. Do not put the answer in it. |
| `options` | yes | Two to six objects. Each needs `id`, `text`, and `explanation`. |
| `correctAnswer` | yes | The `id` of exactly one option. |
| `explanation` | yes | Why that answer is correct. Leave it blank only in a private draft; the API route can generate a replacement. |

`option.explanation` says why that choice is right or wrong. The test fails if any of them is empty, or if `correctAnswer` does not match exactly one option.

### CSV columns

`id`, `topic`, `source`, `question`, `notation`, `notationAlt`, `correctAnswer`, `explanation`, `optionA`, `explanationA`, `optionB`, `explanationB`, `optionC`, `explanationC`, `optionD`, `explanationD`.

`optionE` / `explanationE` and `optionF` / `explanationF` are optional. A blank option is skipped. See `data/examples/question.csv`.

JSON may be one question, an array, or `{ "questions": [ ... ] }`. See `data/examples/question.json`.

## Explanation fallback

`app/api/explain/route.ts` runs on the server. It reads `ANTHROPIC_API_KEY` and calls the Anthropic Messages API. The model defaults to `claude-sonnet-5-5`. Override it with `ANTHROPIC_MODEL`.

The browser calls that route only when a checked question has a blank explanation or a blank option explanation. The reply is cached in `localStorage`. The key never goes to the browser. If the key is missing, or the request fails, the page shows `explanation unavailable` and the rest of the app keeps working.
