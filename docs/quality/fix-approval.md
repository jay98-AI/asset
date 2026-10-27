# Fix Approval Ledger — Phase 5

**Status:** COMPLETE. Four fixes were approved and applied (F-A11Y-01, F-A11Y-05, F-A11Y-06, F-DATA-01); the truthful F-UX-01 copy correction was included; the user then explicitly confirmed checkpoint commit `0129c92` on 2026-10-25.

**Product constraints confirmed by the user on 2026-10-25:** desktop-only (mobile navigation deferred) and database/backend deliberately absent. The application was committed only after testing and explicit confirmation.
**Rule:** only IDs marked `approved` below may change application behaviour. Everything else stays exactly as it is and is recorded as deferred.

---

## Why this file exists

`FIX-01` requires that only explicitly approved findings are fixed. `FIX-03` requires that nothing is committed until the user confirms the final result. This ledger is the single source of truth for both, so a later session cannot "remember" an approval that never happened.

---

## Decisions

| ID | Severity | Area | Decision |
|---|---|---|---|
| F-A11Y-01 | critical | Browse project picker has no accessible name | ✅ **approved** 2026-10-25 |
| F-MAINT-04 | high | Clean checkout could not build because source, tests, docs, and the axe dependency were untracked | ✅ **resolved** by confirmed checkpoint `0129c92` |
| F-RESP-01 | high | Episode/scene navigation hidden below 720px | ⏸ **deferred by design** — desktop-only application |
| F-UX-01 | high | Upload drop zone does nothing | ✅ **fixed (copy only)** 2026-10-25 — panel is clearly non-interactive and truthful; real upload stays deferred to the asset API |
| F-A11Y-02 | serious | Contrast fails on 30 nodes | ⬜ pending |
| F-A11Y-03 | serious | Brand accessible name mismatch | ⬜ pending |
| F-A11Y-04 | serious | Dialog focus leak, no Escape, no focus restore | ⬜ pending |
| F-A11Y-05 | serious | Login error not announced | ✅ **approved** 2026-10-25 |
| F-A11Y-06 | moderate | Search field named only by placeholder | ✅ **approved** 2026-10-25 |
| F-A11Y-07 | minor | Decorative glyph in name, filter group role, duplicate scene labels | ⬜ pending |
| F-UX-02 | medium | Delete confirmation cannot be cancelled | ⬜ pending |
| F-UX-03 | medium | Stale toast can describe a previous action | ⬜ pending |
| F-UX-04 | medium | "sorted by most relevant" is false | ⬜ pending |
| F-DATA-01 | medium | Empty-library fallback, `Date.now()` ids, silent scene coercion | ✅ **approved** 2026-10-25 |
| F-DEP-01 | low | Fonts fetched from Google Fonts at runtime | ⬜ pending |

Decisions are one of: `approved`, `rejected`, `deferred`.

---

## How approval is recorded

Reply with the IDs, for example:

- `approve all priority 1` → the first four rows above plus the serious set
- `approve F-A11Y-01, F-UX-01, F-MAINT-04`
- `approve everything except F-A11Y-02`

This session then fills the table with `approved`, and only afterwards writes `05-01-PLAN.md` scoped to exactly those IDs.

---

## Pre-verification of F-MAINT-04 (2026-10-25)

The proposed fix was rehearsed in a scratch clone rather than guessed:

| Attempt | What was injected | Result |
|---|---|---|
| 1 | nothing | build fails, no entry point |
| 2 | `src/`, `index.html`, `vite.config.js` | 6/6 gates, but only **2** frontend and **1** browser test — the milestone's suites are uncommitted |
| 3 | + `tests/**`, `docs/quality/**` | browser gate fails: `@axe-core/playwright` missing from the uncommitted `package.json` |
| 4 | + `package.json`, `package-lock.json` | **6/6 gates, 78 frontend, 17 browser** — reproducible |

So the approved commit set is: `src/`, `index.html`, `vite.config.js`, `tests/`, `docs/quality/`, `package.json`, `package-lock.json`.

## Applied and verified — 2026-10-25

| ID | Verification |
|---|---|
| F-A11Y-01 | Axe `select-name` critical now **0** across all 7 surfaces; browse select has `aria-label="Project"` and tests query it by role+name |
| F-A11Y-05 | Error node is `role="alert"` with id `admin-login-error`; input reports `aria-invalid` + `aria-describedby`; new test asserts all three |
| F-A11Y-06 | Search field exposes `aria-label="Search assets"`; the member suite now queries by role+name instead of placeholder |
| F-DATA-01 | `Date.now()` replaced by a counter; link targets validated as whole numbers; final delete returns to Search. Three new tests cover ids, validation, and the empty library |
| F-UX-01 | Copy-only fix: the upload panel is no longer a button, no longer promises a file picker or "500 MB", and states that files arrive with the asset API. Real upload remains out of scope |

Gate after fixes: `npm run quality` **6/6** — initially 83 frontend tests and 17 browser tests. After the voice-over preview, the confirmed checkpoint was rechecked at **92 frontend, 17 tooling, and 17 browser tests**. Committed as `0129c92` after explicit user confirmation.

## Definition of done per approved fix

1. The behaviour changes only for the approved ID.
2. The relevant automated check exists and passes (a new test is added when the defect had no coverage).
3. The original reproduction from `findings-report.md` no longer reproduces.
4. `npm run quality` stays 6/6.
5. The before/after is shown to the user before anything is committed.

## Milestone exit criteria tied to Phase 5

| Requirement | Exit criterion | Current state |
|---|---|---|
| `UX-01` | Axe reports **0 critical and 0 serious** violations across all 7 scanned surfaces (search, browse, detail, login, admin, admin detail, mobile search) | Deferred: critical `select-name` is resolved; serious `color-contrast` ×41 nodes and `label-content-name-mismatch` ×56 nodes remain, along with dialog focus/Escape/restore |
| `QA-01` | `git clone` → `npm ci` → `npm run build` succeeds from a clean checkout | Complete: checkpoint `0129c92` includes the application and a fresh clone passed all 6 quality gates |
| `FIX-02` | Every applied fix has a passing retest linked to its ID | Complete — linked above and included in the green aggregate gate |
| `FIX-03` | Commit happens only after explicit confirmation of the reviewed result | Complete — user confirmation preceded checkpoint `0129c92` |

---

## Explicitly out of scope, regardless of approval

These remain prototype constraints and will not be changed in this milestone even if requested in passing:

- real authentication or server-side authorization (the `admin123` gate stays a prototype)
- database, API, or persistence work
- real upload, download, ZIP generation, or file storage
- deployment or infrastructure
- unapproved redesign or new product features

If an approved fix would require one of these, the ledger records the conflict instead of silently expanding scope.
