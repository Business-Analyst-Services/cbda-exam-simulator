# IIBA®-CBDA Exam Simulator

A single-file, offline practice exam for the **IIBA® Certification in Business Data Analytics
(IIBA®-CBDA)**, aligned to the **Guide to Business Data Analytics** and weighted to the published
exam blueprint. Sit the full 75-item paper under timed conditions, or run a coached study session
over the domains you choose.

No install, no sign-up, nothing leaves your browser. Open `index.html`.

Sister project to the [CBAP® Exam Simulator](https://github.com/Business-Analyst-Services/cbap-exam-simulator):
same engine, same build pipeline, different body of knowledge.

---

## What it is

One self-contained HTML file holding 75 original scenario-based items across all six CBDA domains.
The first screen asks how you want to run it.

**Exam sitting** — all 75 items, blueprint-weighted, 2 hours on the clock, pausable,
auto-submitting at zero. Nothing is revealed until you submit. Closest to the real thing.

**Study session** — choose your domains and a length (10, 25, 50, or everything selected). Each
item is marked the moment you answer, with a verdict on all four options, the reasoning behind the
best answer, the domain and task it comes from and the trap it tests. The set is drawn in blueprint
proportion across the domains you picked, and both questions and options are shuffled, so retaking
a set is not a memory test. Untimed, with the clock counting up.

Both modes end on the same diagnostic: score by domain, task-level gaps, key terms, error patterns
and a prioritised study plan.

| | |
|---|---|
| **Items** | 75-item exam bank |
| **Coverage** | All 6 domains and all 26 tasks in the task map below |
| **Modes** | Timed exam sitting · study session |
| **Exhibits** | 8 items carry a data table to read: regression output, a confusion matrix, a data quality profile, an A/B test, rates against counts |
| **Storage** | None. No accounts, no cookies, no analytics, no network calls |

### Blueprint weighting

| Domain | Blueprint weight | Items |
|---|---:|---:|
| 1 · Identify the Research Questions | 20% | 15 |
| 2 · Source Data | 15% | 11 |
| 3 · Analyze Data | 16% | 12 |
| 4 · Interpret and Report Results | 20% | 15 |
| 5 · Use Results to Influence Business Decision Making | 20% | 15 |
| 6 · Guide Organization-level Strategy for Business Analytics | 9% | 7 |
| **Total** | **100%** | **75** |

Weights are the published IIBA-CBDA blueprint. Items are those weights applied to 75 by largest
remainder. The certification handbook words domain 6 as "Company-level".

## Features

- **Exam-realistic sitting** — countdown clock, flag-for-review, 75-cell question navigator,
  keyboard answering (`A`–`D` to answer, `←`/`→` to move, `F` to flag, `G` for the grid).
- **Deferred feedback** — no hints, no running score, no domain labels during the sitting.
- **Study mode with feedback after every question** — right or wrong called immediately, a verdict
  on each of the four options, why the best answer wins, the domain and task cited, and the trap
  named. Answers lock once revealed. Running score in the header, navigator cells coloured
  right/wrong as you go.
- **Domain filtering** — pick one domain to drill or any combination; the session is drawn in
  blueprint proportion across what you selected, and the summary tells you which domains it skipped.
- **Data exhibits** — a question can carry a table you have to read. The distractors on those items
  are the conclusions you reach by reading a coefficient without its p-value, trusting accuracy on
  an imbalanced outcome, comparing counts where rates are needed, or averaging training and test
  results.
- **Full review after submission** — every option gets a verdict, not just the correct one, plus
  the discriminating detail in the scenario, the reference and the named trap.
- **Diagnostic study plan** — per-domain performance against blueprint weights with a 70%
  threshold (short sets are marked as thin samples), task-level gaps, key terms you misread,
  behavioural error patterns (including how long you spent on wrong answers against right ones),
  and prioritised actions ranked by weight × gap.
- **Light and dark**, responsive, and printable to PDF.

The 70% threshold is this simulator's working target. IIBA does not publish a pass mark.

## Question design

These are interpretation questions, not recall questions. Every item is written to the same rules:

- A concrete scenario of 40–110 words with an organisation, a role and a tension — and at least
  one deliberately irrelevant detail.
- Four options of comparable length and grammatical form, exactly one best answer.
- At least two distractors are legitimate business data analytics actions that are simply wrong
  for *this* stage, *this* audience, *this* data or *this* constraint.
- Techniques are tested at recognition and interpretation level: when a method fits and what its
  output means, never how to build it. No item needs arithmetic beyond comparing supplied figures.
- Each item names the trap it tests — modelling before the question is framed, the wrong analytics
  type, correlation read as causation, statistical significance mistaken for business significance,
  a correct output for the wrong audience, stopping at insight, and so on.

**Answer key integrity.** The key was generated before the questions were written: 19/19/19/18
across A/B/C/D, no two consecutive items sharing a letter, and no cyclic pattern. Domains are
interleaved so no two consecutive questions come from the same domain. Every item was written
first and then placed into its pre-assigned slot by script.

**Length is not a tell.** The correct option is the longest in 20 of the 75 items, which is what
chance would give. `build.js` fails the build if that drifts above 35%, or if any single correct
option is conspicuously longer than its distractors.

## Task map

Items cite the domain and the task by name.

| Domain | Tasks |
|---|---|
| 1 Identify the Research Questions | Define Business Problem or Opportunity · Identify and Understand the Stakeholders · Assess Current State · Define Future State · Formulate Research Questions · Plan Business Data Analytics Approach |
| 2 Source Data | Plan Data Collection · Determine the Data Sets · Collect Data · Validate Data |
| 3 Analyze Data | Develop Data Analysis Plan · Prepare Data · Explore Data · Perform Data Analysis · Assess the Analytics and System Approach Taken |
| 4 Interpret and Report Results | Validate Understanding of Stakeholders · Plan Stakeholder Communication · Determine Communication Needs of Stakeholders · Derive Insights from Data · Document and Communicate Findings from Completed Analysis |
| 5 Use Results to Influence Business Decision Making | Recommend Actions · Develop Implementation Plan · Manage Change |
| 6 Guide Organization-level Strategy for Business Analytics | Organizational Strategy · Talent Strategy · Data Strategy |

> **Verify against your copy of the Guide.** The Guide is a members-only publication. Section
> numbers are deliberately not cited, because the Guide's chapter numbering and the blueprint's
> competency numbering do not match. A few task names here are not confirmed from a public source:
> the last task in domain 3, the three stakeholder and communication tasks in domain 4, and the
> three tasks in domain 6. If your copy words a task differently, the Guide wins — change it in
> `DOMAINS` in `build.js`, in `TERMS` in `index.html` and in `questions.json`, then rebuild.

## Files

| File | Purpose |
|---|---|
| `index.html` | The entire application — open it in any browser |
| `questions.json` | The 75-item exam bank as data |
| `build.js` | Validates the data and embeds it into `index.html` |

### `questions.json` shape

```json
{
  "n": 1,
  "ka": 5,
  "kaName": "Use Results to Influence Business Decision Making",
  "task": "Recommend Actions",
  "trap": "Stopping at insight without recommendation, implementation or change",
  "stem": "Analysis for a food-delivery platform shows that …",
  "exhibit": { "type": "table", "title": "…", "cols": ["…"], "rows": [["…"]] },
  "why": "The analysis identified where and when the damage occurs …",
  "options": [{ "text": "…", "verdict": "…" }],
  "answer": 0
}
```

`ka` is the domain number, kept under that name so the data stays interchangeable with the CBAP
simulator's engine. `answer` is the zero-based index of the correct option. `exhibit` is optional
and takes the same shapes as the CBAP simulator (`table`, `dashboard`, `tree`, `matrix`, `flow`,
`canvas` and the SVG diagram types).

## Running it

Download `index.html` and open it. It works offline and from a `file://` path. To host it, enable
GitHub Pages on the repository and point it at the default branch root.

> **Note:** progress is held in the browser tab only. Reloading mid-sitting starts you over.

## Not built yet

The engine carries the CBAP simulator's other modes, and each one switches itself on when its data
file exists. None of these files is in the repository yet:

| Mode | Data file | Status |
|---|---|---|
| Technique lab — learn cards and drill | `techniques.json`, `technique-questions.json` | Not written |
| Study plan | `studyplan.json` | Not written |
| One scenario worked end to end | `scenario.json` | Not written |
| PowerPoint, Word and Excel downloads | generators from the CBAP repository | Not ported |

## Contributing

Corrections to keyed answers, task references or statistical interpretations are welcome — open an
issue quoting the item number shown in the review pane.

Edit the JSON, never the arrays inside `index.html`. Then:

```bash
node build.js
```

That regenerates the embedded data block and refuses to write if anything is wrong: the exam bank
must be 75 items in the 15/11/12/15/15/7 blueprint allocation; the answer key must be balanced to
within one, with no letter twice running and no repeating cycle; no two consecutive items may share
a domain; every item needs four options each with a verdict, a task that belongs to its domain, a
trap from the library and a 40–110 word stem ending on its question; no option may use an absolute;
and every table row must match its header width. Commit the JSON and the regenerated `index.html`
together.

## Disclaimer

Not affiliated with, endorsed by, or sponsored by the International Institute of Business Analysis™
(IIBA®). **IIBA®** and the **IIBA®-CBDA** designation are marks of the International Institute of
Business Analysis. All question content here is original work written to align with the concepts
in the Guide to Business Data Analytics; no text from the Guide is reproduced. This is unofficial
study material and is no substitute for the Guide itself.

## Licence

MIT — see [LICENSE](LICENSE).
