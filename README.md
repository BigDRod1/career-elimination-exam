# Career Elimination Exam

[![CI](https://github.com/BigDRod1/career-elimination-exam/actions/workflows/ci.yml/badge.svg)](https://github.com/BigDRod1/career-elimination-exam/actions/workflows/ci.yml)

**Live site:** https://career-elimination-exam.vercel.app

An in-depth, free career exam that starts with **917 careers** and crosses off every one that doesn't fit you. That includes every occupation in the U.S. government's O*NET database, plus a few non-standard paths such as startup founder and content creator. It ends with three focus options and a first-year plan.

If it helps you, please ⭐ star the repo so other people can find it.

## How it works

You answer 11 parts. Every answer re-scores all 917 careers live, in your browser.

| Part | What it measures |
| --- | --- |
| 1. Where you stand | Education, runway, time to a full salary, willingness to move |
| 2. Personality | Big Five traits (20 statements), matched against O*NET work styles |
| 3. Interests | Holland RIASEC types (30 activities), weighted most heavily |
| 4. Strengths | 17 self-rated skills, matched against O*NET skill importance |
| 5. Values | 13 work values plus three must-haves |
| 6. Work style | Setting, people contact, structure, pace, remote, hours, schedule, employer, role |
| 7. Dealbreakers | 27 hard refusals, education ceiling, income floor, risk tolerance |
| 8. Life and meaning | Success at 45, causes, legacy, lifestyle |
| 9. Energy audit | Activities that absorb you and ones that drain you |
| 10. Gut check | Keep, maybe or cross off your top 20 |
| 11. Showdown | Head-to-head bracket between your top 8 |

Careers leave the running in three ways:

- **Dealbreakers and limits.** Anything you refuse, schooling past your ceiling, pay below your floor, too much income risk or too long to reach full pay crosses a career off immediately.
- **Weak fit.** Once four scoring areas have answers, careers far behind your leader drop out.
- **Your own cuts.** You decide the rest in the gut check, on the career board or in the showdown.

The fit score blends interests (24%), values (16%), work style (14%), strengths (12%), personality (10%), life goals (10%), energy (8%) and outlook (6%). The scoring lives in [`assets/engine.js`](assets/engine.js) as pure functions with tests.

## Data

| Source | Used for | License |
| --- | --- | --- |
| [O*NET 31.0 Database](https://www.onetcenter.org/database.html), USDOL/ETA | Titles, descriptions, interest profiles, skills, abilities, knowledge, work activities, work context, work styles, education, related occupations, alternate titles | CC BY 4.0 |
| [BLS Occupational Employment and Wage Statistics](https://www.bls.gov/oes/), May 2025 | Median and 90th-percentile pay | Public domain |
| [BLS Employment Projections](https://www.bls.gov/emp/), 2025–35 | Job growth, openings, employment, self-employment share, typical education and training | Public domain |

[`scripts/build-data.mjs`](scripts/build-data.mjs) turns these sources into `data/careers.json`. Every derived score, such as people contact, physical demand, remote feasibility, estimated AI exposure and dealbreaker flags, is computed from documented O*NET elements in that script. Six non-standard paths are hand-estimated in [`scripts/extra-careers.mjs`](scripts/extra-careers.mjs) and labeled as estimates in the app.

**Attribution:** This site incorporates information from the O*NET 31.0 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the CC BY 4.0 license. USDOL/ETA has not approved, endorsed, or tested these modifications. O*NET® is a trademark of USDOL/ETA.

## Development

No build step and no runtime dependencies. You need Node 20 or newer.

```bash
npm run dev          # serve the site at http://127.0.0.1:5173
npm test             # data validation and engine tests
npm run build:data   # rebuild data/careers.json (downloads O*NET tables into .cache/)
```

ES modules need an HTTP server, so opening `index.html` straight from disk will not work.

### Refreshing the data

- **O*NET:** bump `ONET_VERSION` in `scripts/build-data.mjs` and run `npm run build:data`.
- **BLS:** BLS blocks scripted downloads. Open the BLS projections table in a browser, paste [`scripts/bls-extract.js`](scripts/bls-extract.js) into the devtools console, move the two downloaded files into `data-src/bls/`, then rebuild.

### Project layout

```
index.html            page shell, metadata, attribution
assets/app.js         UI
assets/engine.js      scoring and elimination (pure, tested)
assets/catalog.js     exam questions and reference data
assets/styles.css     styles (light and dark)
data/careers.json     generated dataset (917 careers)
data-src/bls/         BLS snapshots
scripts/              data pipeline, dev server, BLS refresh snippet
tests/                node:test suites
```

## Privacy

Answers are saved in your browser's local storage only. There are no accounts, analytics or server calls, apart from loading the page, fonts and the GitHub star count. Use **Save answers (.json)** on the Results page to move your progress to another device.

## Caveats

This is a structured self-reflection tool, not a validated psychological test. Pay and growth are national U.S. figures and vary a lot by location and experience. AI exposure is an estimate derived from O*NET task data, not a forecast.

## License

Code is MIT licensed. Data is subject to the licenses above.
