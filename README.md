# Career Elimination Exam

An interactive exam that starts with 125 careers and crosses off every one that doesn't fit you. It ends with three focus options and a first-year plan.

## How it works

You answer 11 parts. Every answer re-scores all 125 careers live.

| Part | What it measures |
| --- | --- |
| 1. Where you stand | Education, runway, time to a full salary, willingness to move |
| 2. Personality | Big Five traits (20 statements) |
| 3. Interests | Holland RIASEC types (30 activities), weighted most heavily |
| 4. Strengths | 17 self-rated skills |
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

The fit score blends interests (24%), values (16%), work style (14%), strengths (12%), personality (10%), life goals (10%), energy (8%) and outlook (6%).

## Views

- **Exam.** The 11 parts, with a live tracker of what's still standing.
- **Career board.** All 125 careers with fit scores and the reason each was crossed off. Open any career for its breakdown, pay, schooling, growth and AI exposure.
- **Your profile.** Holland code and archetype, interest hexagon, personality, values, strengths, work style and ikigai.
- **Results.** Three focus options, a 12-month plan, the elimination funnel, a full ranking and a log of every cut.

## Running it

It is a single static `index.html` with no build step and no dependencies beyond Google Fonts. Open the file in a browser, or serve the folder with any static host.

Answers are saved in the browser's local storage only. Nothing is sent to a server. Use **Save answers (.json)** on the Results page to move your progress to another device.

## Caveats

This is a structured self-reflection tool, not a validated psychological test. Pay, growth and automation figures are rough US estimates for comparing careers. For current data, see the [Occupational Outlook Handbook](https://www.bls.gov/ooh/).
