# Manual Quality-Command Reviews

These are reusable procedures, not completed evidence. A later reviewer records the date, result, and notes after performing a procedure; leaving the record blank does not claim that the review already ran.

## QC-MAN-01: Clean-checkout command review

**Purpose:** Confirm the independently runnable Phase 1 quality commands are understandable from the repository root without changing application behavior.

### Prerequisites

- Start from a clean checkout at the repository root.
- Install the Node version required by `package.json` and install dependencies with `npm ci`.
- Provision Chromium once with `npm run test:browser:install` before the browser command.

### Commands and expected visible outcomes

Run each command from the repository root:

```sh
npm run lint
npm run build
npm run test:frontend
npm run test:tooling
npm run test:browser
npm run test:traceability
npm run quality
```

- Each command should show its own command/test output and exit with status zero when its gate passes.
- `npm run build` should finish Vite's production build; frontend, tooling, browser, and traceability commands should identify their test results.
- `npm run quality` should print `[quality] START` and `[quality] PASS` for Lint, Production build, Frontend tests, Tooling contracts, Browser tests, and Requirement traceability, then `[quality] SUMMARY PASS: 6/6 gates passed`.

### Failure conditions

- A command is missing, requires an undocumented prerequisite, exits non-zero, or does not identify its failed gate/test.
- This procedure must not be recorded as passed merely because the commands are listed; execute them in the stated environment before recording a result.

### Result record

| Date | Result (pass/fail) | Notes |
| --- | --- | --- |
| 2026-10-25 | **FAIL** | Cloned the repository to a scratch directory and ran `npm ci` then `npm run build`. The clean checkout contains only `README.md`, `docs/`, `eslint.config.js`, `package.json`, `package-lock.json`, `playwright.config.js`, `scripts/`, `tests/`, and `vitest.config.js`. There is no `src/`, `index.html`, or `vite.config.js`, so Vite has no entry point and exits 1. The commands are repeatable in the author's working tree but **not** from a clean checkout. Root cause: the application source was never committed. See F-MAINT-04. |

## QC-MAN-02: Pass/failure output review

**Purpose:** Review whether the aggregate runner makes pass and failure information visible while preserving diagnostics and attempting every named gate.

### Prerequisites

- Complete the clean-checkout setup in QC-MAN-01.
- Do not edit application files or deliberately break a test to manufacture a result.
- Use the committed `scripts/run-quality.test.mjs` failure-path assertions as automated evidence; do not deliberately break a real gate to manufacture a manual result.

### Commands and expected visible outcomes

Run these commands from the repository root:

```sh
npm run test:frontend
node --test scripts/run-quality.test.mjs
npm run quality
```

- The runner test should prove pass, single-failure, multi-failure, process-error, and signal-termination paths without starting real quality gates.
- Passing aggregate output should print `[quality] START` and `[quality] PASS` labels for all six named gates followed by `[quality] SUMMARY PASS: 6/6 gates passed` and return status zero.
- A real failed gate should preserve its diagnostic output, print that gate's `[quality] FAIL` label, appear in the final failed-gates summary, and make the aggregate command return non-zero.

### Failure conditions

- Output hides the named failed check, returns zero after a real failure, or provides no actionable diagnostics.
- A review record claims a manual failure observation that was not actually performed, or treats the simulated runner tests as a substitute for a real failure result.

### Result record

| Date | Result (pass/fail) | Notes |
| --- | --- | --- |
| 2026-10-25 | PARTIAL | `npm run quality` was executed in the working tree and printed labeled `[quality] START`/`PASS` lines for all six gates ending in `SUMMARY PASS: 6/6 gates passed`, and a deliberately failing gate was exercised in `scripts/run-quality.test.mjs`. The clean-checkout prerequisite from QC-MAN-01 is unmet, so the procedure is not closed. |

## QC-KBD-01: Keyboard, dialog, and naming review

**Purpose:** Confirm keyboard reachability, focus behaviour, dialog safety, and form/status announcement in the real browser.

**Environment:** Chromium 1248 (headless), 1440x900, 2026-10-25.

### Procedures and recorded results

| # | Check | Procedure | Result | Evidence |
|---|---|---|---|---|
| 1 | Focus visible | Tab through search view | PASS — 2px amber outline on every focused control (`button:focus-visible`) | `src/styles.css:32` |
| 2 | No keyboard trap | Tab through member and admin surfaces | PASS — focus always advances | probe |
| 3 | Dialog has a name | Admin -> login dialog | PASS — announced "Admin access" via `aria-labelledby` | ariaSnapshot |
| 4 | Escape closes dialog | Admin -> press Escape | **FAIL** — dialog stays open | dialog count stayed 1 |
| 5 | Focus stays in dialog | Admin -> Tab x4 | **FAIL** — focus escapes behind the backdrop after 2 tabs | sequence `[true, true, false, false]` |
| 6 | Focus restored on close | Admin -> Cancel | **FAIL** — focus lands on `BODY` | `document.activeElement` |
| 7 | Error announced | wrong password -> Unlock | **FAIL** — no `role`, no `aria-live`, no `aria-invalid` | `.field-error` attributes |
| 8 | Search field named | inspect accessible name | **FAIL** — name comes only from the placeholder | ariaSnapshot |
| 9 | Status messages announced | publish / download | PASS — toast uses `role="status"` | `src/App.jsx:303` |
| 10 | Decorative glyphs hidden | inspect Download button | **FAIL** — name reads "Download V4 ↓" | ariaSnapshot |

**Verdict:** 4 pass, 6 fail. Failures are reported as F-A11Y-04, F-A11Y-05, F-A11Y-06, and F-A11Y-07 in `findings-report.md`. No application change was made.

## QC-UI-01: Structured design review (UI/UX Pro Max unavailable)

**Purpose:** Review hierarchy, spacing, consistency, contrast, and state clarity.

**Note:** the roadmap names the UI/UX Pro Max skill. That skill is not installed in this environment, so the same dimensions were reviewed manually against the code and 1440/390px renders. This substitution is recorded rather than hidden.

### Procedures and recorded results

| Dimension | Observation | Result |
|---|---|---|
| Hierarchy | Display heading, search control, filters, then grid — clear top-to-bottom reading order on all views | PASS |
| Spacing | Consistent 4/8/16/24/32/64 rhythm; no cramped controls at 390px | PASS |
| Consistency | One accent (`#f1b654`) for primary actions and selection; danger colour reserved for delete | PASS |
| Contrast | Muted 12px text fails AA in Browse, Detail, Admin, and the login hint | **FAIL** — F-A11Y-02 |
| State clarity | Selection tray, active chips, and armed delete are visible | PARTIAL — F-UX-02 (no way to disarm delete) |
| Empty states | Search has a clear empty state with Reset; Browse has a compact empty state; Detail has none | PARTIAL — F-DATA-01 |
| Responsive usability | No horizontal overflow at 390/820/1440 on four surfaces | PASS |
| Responsive task completion | Episode/scene navigation is unavailable below 720px | **FAIL** — F-RESP-01 |

**Verdict:** the visual system is coherent; the failures are contrast, the mobile navigation gap, and two state-clarity gaps.
