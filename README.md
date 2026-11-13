[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.24070484.svg)](https://doi.org/10.5281/zenodo.24070484)

# Healthcare Firewall Migration Toolkit

**A free, open-source planner and set of templates that help small and mid-sized healthcare organizations replace a firewall safely, without cutting clinicians off from the systems they need or leaving patient data exposed.**

Created by Temitope Akintunde Ogunwola.

https://akintundekolapo22.github.io/hc-firewall-migration-toolkit/

Built for the IT lead at a clinic, community health center or small hospital, often a team of one or two. Plain-language steps, a calculated readiness check, and a report you can print and keep on file.

> Not legal advice and not a compliance certification. See [DISCLAIMER.md](DISCLAIMER.md).

## What it does

The toolkit puts into practice the five-phase **Secure Migration and Operational Stability Framework**:

> Ogunwola, T. A., & Alozie, C. (2026). Enterprise firewall modernization for business continuity: A framework for secure migration and operational stability. *Computer Science & IT Research Journal, 7*(5), 347–361. https://doi.org/10.51594/csitrj.v7i5.2287

| Step | What you do | Framework phase |
|---|---|---|
| 1. Pre-migration audit | Record the baseline, list zones and critical systems, and list every flow that must keep working or stay blocked. These flows become your test matrix. | Phase 1 |
| 2. Risk register | Rate 13 pre-filled risks (10 from the framework, 3 for healthcare). Scores and levels are calculated. | Phase 1, reviewed throughout |
| 3. Rule review | Give every firewall rule a finding (keep, unused, shadowed, over-broad, duplicate, no owner) and a decision. Rules can be pasted in as CSV. | Phases 1 and 2 |
| 4. Rollback plan | Name the decision owner, agree measurable triggers, complete the prerequisites, write the steps, and log rehearsals. | Phases 1 and 4 |
| 5. Go / no-go | See a readiness check calculated from steps 1 to 5, confirm 12 criteria, and record joint sign-off by the security and operations leads. | Phase 4 |

At the end, the **report** page gathers everything into one printable plan (print or save as PDF).

## Private by design

- The planner is a static web page. It runs entirely in your browser; there is no server and no account.
- Answers are kept only in your browser's local storage on that device. Use **Save to file** to keep a copy or move it to another computer, and **Open file** to load it again.
- Never enter patient names, record numbers or other protected health information. The planner needs only system and network details.

## Prefer documents?

The same five templates are in [`templates/`](templates/) (readable on GitHub) and [`fillable/`](fillable/) (Excel workbook and Word forms) for organizations that work on paper or in spreadsheets.

## How the templates relate to common healthcare guidance

A starting point, not a compliance determination. Check the current editions of each document.

| Step / template | HIPAA Security Rule (45 CFR Part 164) | HHS Health Industry Cybersecurity Practices (HICP) | NIST Cybersecurity Framework 2.0 |
|---|---|---|---|
| 1 Audit | Risk analysis, §164.308(a)(1)(ii)(A) | Asset management; network management; network-connected medical devices | ID.AM |
| 2 Risk register | Risk analysis and risk management, §164.308(a)(1)(ii)(A)–(B) | Cybersecurity oversight and governance | ID.RA, GV.RM |
| 3 Rule review | Access control, §164.312(a)(1); evaluation, §164.308(a)(8) | Network management | PR.PS, PR.AA |
| 4 Rollback plan | Contingency plan, including testing and revision, §164.308(a)(7) | Cybersecurity oversight and governance | PR.IR, RC.RP |
| 5 Go / no-go | Evaluation, §164.308(a)(8); audit controls, §164.312(b) | Cybersecurity oversight and governance | GV.RR, ID.IM |

## Repository layout

```
index.html              the planner (static page, no build step)
src/
  content.js            steps, risks, checklists and criteria (CC BY 4.0)
  logic.js              scoring and readiness rules (pure functions)
  storage.js            local-only storage and save/open file
  app.js                the browser interface
  styles.css
test/logic.test.mjs     unit tests for scoring, readiness and CSV handling
templates/              the five templates as Markdown
fillable/               Excel workbook and Word forms
.github/workflows/      tests on every pull request; test and deploy to GitHub Pages on push to main
```

## For developers

Requires Node.js 20 or later for the tests. There are no dependencies to install.

```bash
npm test          # run the unit tests
npm start         # serve locally at http://localhost:8000 (needs Python 3)
```

The page uses JavaScript modules, so open it through a local web server, not by double-clicking `index.html`.

## Publishing it for free

The included workflow runs the tests and deploys the site to GitHub Pages on every push to `main`. In the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**. The site appears at `https://<your-username>.github.io/<repository-name>/`.

## License

- Code (`index.html`, `src/*.js` except `content.js`, `src/styles.css`, tests, workflows): [MIT License](LICENSE).
- Content (`src/content.js`, `templates/`, `fillable/`, documentation): [CC BY 4.0](LICENSE-CONTENT.md).

## How to cite

See [CITATION.cff](CITATION.cff), or use **Cite this repository** on GitHub.

## Feedback

If your organization uses the planner or templates, please tell us what worked and what did not by opening a **Field report** issue. Corrections and suggestions are welcome too. See [CONTRIBUTING.md](CONTRIBUTING.md).
