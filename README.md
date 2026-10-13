# Grade 5 Theory

An unofficial practice room for the ABRSM Grade 5 Music Theory paper, built for piano students who need the written exam before Grade 6 practical. Questions cover rhythm and time, pitch and clefs, keys and scales up to six sharps or flats, intervals, chords and cadences, transposition (including instruments in B♭, A and F), Italian, French and German terms, ornaments, and music in context. A short extra set covers Grade 5 aural and sight-reading ideas. That set is for the practical exam, so the timed mock leaves it out.

This project is not affiliated with ABRSM. The questions in `data/questions` are original, written in the style of the paper. Do not commit verbatim text from ABRSM or other publishers' papers to a public repository. If you own a paper and want a private reminder of where an idea came from, put a citation in `source` (for example `ABRSM 2023 Paper A Q3`) and write the question in your own words.

## Local development

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in the Google sign-in variables below, then open [http://localhost:3000](http://localhost:3000). The first screen is the Google sign-in page.

```bash
npm test
npm run build
```

`npm test` checks every question file against the schema. `npm run build` is the Next.js production build used on Vercel.

The app stores progress, mock results, concept lessons and any generated explanations in `localStorage` on the device. Nothing is sent to a server unless a question is missing an explanation, a weak-spot lesson is requested, or you run `npm run check-answers`, and only when `ANTHROPIC_API_KEY` is set.

The 2021, 2022 and 2023 ABRSM practice-paper books are not in this bank. Their questions, options and score excerpts were not imported. `source` on every shipped question is `original`.

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, import the repository. The framework preset is Next.js. Leave the install and build commands as `npm install` and `npm run build`.
3. In Project Settings → Environment Variables, set the Auth.js variables from the next section. Sign-in will not complete until they are present.
4. Optional: set `ANTHROPIC_API_KEY` to an Anthropic API key. The model defaults to `claude-fable-5-1`. Set `ANTHROPIC_MODEL` only if you want a different one.
5. Deploy.

Without the Anthropic key, practice and the mock still work. A question that has no written explanation shows **explanation unavailable**.

Copy `.env.example` to `.env.local` for the same variables on your machine. Never commit a real key or OAuth secret.

## Google sign-in

Every page, API route, and private image is behind Auth.js (next-auth v5) with the Google provider. Middleware sends an unsigned visitor to `/signin`. An unsigned call to `/api/*` (including `/api/private-image`) gets `401`. `/api/auth/*` stays open so Google can finish the redirect.

Only addresses in `ALLOWED_EMAILS` may sign in. The check trims spaces and ignores case. Anyone else lands on `/access-denied`. The app does not contain a built-in list: an empty `ALLOWED_EMAILS` denies every account. The intended allowlist for this practice room is `stevezaniel@gmail.com,arisatan9319@gmail.com`.

```bash
AUTH_SECRET=                # openssl rand -base64 32
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
ALLOWED_EMAILS=stevezaniel@gmail.com,arisatan9319@gmail.com
AUTH_TRUST_HOST=true
```

Create the Google client:

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → OAuth consent screen. Choose External, add the app name, and add both Gmail addresses as test users while the app stays in Testing.
2. APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.
3. Authorised JavaScript origins: `http://localhost:3000` and `https://abrsm-grade5-trainer.vercel.app`.
4. Authorised redirect URIs, exactly:
   - `https://abrsm-grade5-trainer.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`
5. Copy the client ID into `AUTH_GOOGLE_ID` and the client secret into `AUTH_GOOGLE_SECRET`, locally in `.env.local` and on Vercel. Set `AUTH_SECRET` and `AUTH_TRUST_HOST=true` in both places, and set `ALLOWED_EMAILS` to the two addresses above.

The header shows **Sign out** once you are inside the practice room.

## How practice works

- **Practise by topic** opens one syllabus area. Choose an option, then check it. The screen shows the correct answer, why it is correct, and why each other option is wrong.
- **Mixed practice** walks through the whole bank.
- **Mock paper** is 18 questions (two from each theory topic) and 30 minutes. You can move between questions. Marking waits until you submit, or until the clock runs out. The real Grade 5 theory exam is longer (about two hours); this is a shorter rehearsal.
- **Train weak spots** (`/practice/weak`) builds a short drill from the concepts you score lowest, with more questions from the lowest scores. Each concept starts with a short lesson. Without an API key the lesson is the built-in note. With a key, Claude writes one and this browser remembers it.
- **Pass strategy** (`/strategy`) is the 75-mark, two-hour paper: pass 50, merit 60, distinction 65, where the marks sit, a time split, and a one-hour plan weighted by your weak topics.
- **Progress** keeps the latest result for each question, mastery by topic and subtopic, the weakest topics, and past papers. Clearing it only affects this browser.

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
  "subtopic": "naming",
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
| `subtopic` | yes | Slug for the concept, such as `cadences` or `clarinet-bb`. Mastery and weak-spot drills group on this. |
| `source` | yes | `original`, or your own citation such as `ABRSM 2023 Paper A Q3`. Do not paste the paper. |
| `question` | yes | The stem. |
| `notation` | no | [ABC notation](https://abcnotation.com/), rendered in the browser with abcjs. In CSV, write line breaks as `\n`. |
| `notationAlt` | no | A short description of the staff for screen readers. Do not put the answer in it. |
| `options` | yes | Two to six objects. Each needs `id`, `text`, and `explanation`. |
| `correctAnswer` | yes | The `id` of exactly one option. |
| `explanation` | yes | Why that answer is correct. Leave it blank only in a private draft; the API route or `npm run check-answers` can fill it. |
| `answerCheck` | no | Written by `npm run check-answers`. Records whether Claude agreed. A disagreement is flagged and the stored `correctAnswer` is kept. |

`option.explanation` says why that choice is right or wrong. The test fails if any of them is empty, or if `correctAnswer` does not match exactly one option.

### CSV columns

`id`, `topic`, `subtopic`, `source`, `question`, `notation`, `notationAlt`, `correctAnswer`, `explanation`, `optionA`, `explanationA`, `optionB`, `explanationB`, `optionC`, `explanationC`, `optionD`, `explanationD`.

`optionE` / `explanationE` and `optionF` / `explanationF` are optional. A blank option is skipped. See `data/examples/question.csv`.

JSON may be one question, an array, or `{ "questions": [ ... ] }`. See `data/examples/question.json`.

## Private papers on this computer

Extract a paper you own with [MinerU](https://github.com/opendatalab/MinerU) on your Mac. Keep that output, and everything it produces, out of git.

```bash
npm run import-mineru -- /path/to/mineru-folder --year 2024 --paper A
npm run check-private
```

`import-mineru` reads the MinerU folder (`*_content_list.json`, and the markdown file when that list has no numbered questions, plus the `images` folder). It groups blocks by printed numbers such as `2.1`, keeps the options, the mark count, any figure, and a handwritten `Answer:` line when MinerU captured one. It writes JSON into `PRIVATE_BANK_DIR`, which defaults to `./private-bank/`. That folder is in `.gitignore`. Do not copy it into `data/questions`, and do not commit it.

The same folder receives `import-report.json`. A question is listed there when options are missing, notation or a figure could not be read, or the OCR looks garbled. Questions with fewer than two options are reported and not added to the bank. Running the import again on the same paper refreshes the extract and keeps any answer, explanations, and Claude cache already stored for that question.

`check-private` asks Claude (`claude-fable-5-1`, or `ANTHROPIC_MODEL`) for an answer only when `correctAnswer` is empty. It writes that answer, and an explanation of every option, back into the private JSON. A later run skips questions that already have an answer and explanations. If `studentAnswer` differs from Claude, `privateAnswer.studentDisagrees` is true and the note says the handwritten answer differs. The handwritten line is not treated as the key.

Refresh the app. Private questions are tagged **My papers** and appear in topic practice. Once an answer is stored they also go into the mock paper and weak-spot drills. A score excerpt is served from the private folder by `/api/private-image` and is not copied into `public/`.

Without `ANTHROPIC_API_KEY`, `check-private` changes nothing. A private question that still has no answer can be opened in topic practice and shows `explanation unavailable`.

The test fixture at `tests/fixtures/mineru-synthetic` is invented. It is not a past paper.

## Explanation fallback

`app/api/explain/route.ts` runs on the server. It reads `ANTHROPIC_API_KEY` and calls the Anthropic Messages API. Explanations, answer checks, and concept lessons all default to `claude-fable-5-1`. Override that with `ANTHROPIC_MODEL`.

The browser calls that route only when a checked question has a blank explanation or a blank option explanation. The reply is cached in `localStorage`. The key never goes to the browser. If the key is missing, or the request fails, the page shows `explanation unavailable` and the rest of the app keeps working.

`POST /api/lesson` uses the same key to write the short lesson at the start of a weak-spot drill. If the key is missing, the drill still runs and shows the built-in lesson for that subtopic.

### Checking answers with Claude

```bash
npm run check-answers
npm run check-answers -- --dry-run
npm run check-answers -- --id intervals-01
```

The script reads `ANTHROPIC_API_KEY` from the environment, then from `.env` and `.env.local`. It asks Claude for an answer **without** revealing `correctAnswer`. When Claude chooses the same option, any blank explanation is filled and saved in the question file. When Claude chooses a different option, the stored answer is left as it is, `answerCheck.agreed` is `false`, and `answerCheck.note` starts with `Disagreement`. Blank explanations on a disagreement are filled only by a second call that is told the stored answer. Questions that already have `answerCheck` and complete explanations are skipped, so a later run does not regenerate them. `--force` checks them again and still will not replace a stored answer or a written explanation.

If the key is not set, the script changes nothing and prints that the key is missing.
