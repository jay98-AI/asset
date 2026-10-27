# Asset Hub — Frontend Findings Report

**Date:** 2026-10-25
**Prepared by:** the successor session (Codex quota ended after Phase 1; Phases 2–4 were completed here)
**Status:** 4 of 14 findings were approved and applied on 2026-10-25 (F-A11Y-01, F-A11Y-05, F-A11Y-06, F-DATA-01). The rest remain unapproved and unchanged.
**Read this first:** every item below is a *proposal*. Nothing gets fixed until you tick it in the approval table at the end.

---

## How this was measured

| Evidence type | Where |
|---|---|
| 78 automated tests (rules, rendered member, rendered admin) | `tests/frontend/` |
| 4 Chromium journeys (member, admin, reset, tracer) | `tests/browser/` |
| 12 responsive checks at 390×844, 820×1180, 1440×900 | `tests/browser/responsive.spec.js` |
| Axe scan of 7 surfaces (5 desktop, the admin detail panel, mobile search) | `docs/quality/a11y-baseline.json` |
| Keyboard, dialog, and naming probes in Chromium | recorded below and in `docs/quality/manual-checks.md` |

**What is already healthy:** no console errors, no horizontal page scrolling at any of the three widths on any of the four surfaces, all member and admin journeys complete, and the in-memory reset behaves exactly as the prototype intends.

---

## Priority 1 — fix before anyone relies on this UI

### F-A11Y-01 — The Browse project picker has no name *(critical)* — ✅ FIXED 2026-10-25

**What you'd see:** a screen reader announces "combo box" and nothing else. Voice control users cannot say "select Project".
**Repro:** Browse → focus the dropdown at the top of the sidebar.
**Evidence:** Axe `select-name`, impact **critical**, `.browse-sidebar select`. This is the only `critical` rule in the whole scan.
**Proposed fix:** give the `<select>` an accessible name (`aria-label="Project"` or a real `<label>`), and keep the visible "Project" text as the label rather than a separate `div`.

### F-RESP-01 — Episode and scene navigation disappears on phones *(high)*

**What you'd see:** on any screen 720px or narrower, Browse shows the project picker and then jumps straight to assets. The breadcrumb still reads "Season 1 / Episode 1", but there is no control to change episode or scene. The CSS hides `.tree` and `.season-label` with `display: none`.
**Repro:** set the viewport to 390px wide → Browse → try to reach Episode 2.
**Evidence:** `src/styles.css:374`; Chromium probe returned `display: "none"` for `.tree` at 390px; the responsive spec had to branch on width and use the project picker instead.
**Proposed fix:** replace the hidden tree with a compact episode/scene selector (two selects, or a disclosure) below 720px. This is the one responsive gap that actually blocks a task.

### F-UX-01 — The upload drop zone does nothing *(high)* — ✅ FIXED 2026-10-25 (copy)

**What you'd see:** "Drop approved file here — or click to browse · PNG, PDF, WAV up to 500 MB". Clicking it does nothing at all. There is no file input in the DOM.
**Repro:** Admin → unlock → click the dashed drop area. No dialog, no toast, no change.
**Evidence:** it is a `<button>` with no handler; `input[type=file]` count is `0`; the probe's click produced no status message.
**Proposed fix:** either wire a real `<input type="file">` (and update copy to match what it does), or relabel it as a description of the expected backend flow. Because this milestone forbids real uploads, **the minimal honest fix is to make the control truthful** — do not leave a button that promises an operation it cannot perform.

**Applied 2026-10-25:** the panel is no longer a `<button>` and no longer hovers like one. It now reads "File upload is not connected yet — publish the metadata below · files arrive with the asset API". The false "up to 500 MB" promise is gone. Real upload stays deferred to the backend milestone.

### F-A11Y-02 — Muted text fails contrast in four places *(serious)*

**What you'd see:** small grey text on dark panels is hard to read, especially at 12px: sidebar labels, property names in asset details, admin section hints, and the "Prototype password" line.
**Repro:** Axe scan of Browse, Detail, and Admin surfaces.
**Evidence:** `color-contrast`, **41 nodes total** — 2 in Browse, 8 in Detail, 19 in Admin, 11 in the admin detail panel, 1 in the login dialog. The muted token is `#96949b`; smaller secondary text drops to `#65636a` in places.
**Proposed fix:** raise the muted colour (and the faint count colour) until it clears 4.5:1 on `#18181b`/`#111113`. This is a token-level change in `src/styles.css` — one line fixes most nodes, but it **does** change the visual baseline, so it needs your approval.

### F-A11Y-04 — Dialogs leak keyboard focus and ignore Escape *(serious)*

**What you'd see:** press Tab twice inside the admin login and focus moves behind the dialog to page buttons. Press Escape and nothing happens. Close the dialog and focus lands on `<body>`, so keyboard users lose their place.
**Repro:** `/` → Admin → Tab ×4 → observe; Escape → dialog still open; Cancel → `document.activeElement` is `BODY`.
**Evidence:** probe sequence `[true, true, false, false]` for "focus inside dialog"; dialog count remains `1` after Escape; `focusAfterClose: "BODY/…"`.
**Proposed fix:** trap focus in the dialog, close on Escape, restore focus to the trigger on close. The dialog already has a correct `role="dialog"`, `aria-modal`, and name ("Admin access"), so this is a contained fix.

### F-A11Y-05 — The login error is silent for screen readers *(serious)* — ✅ FIXED 2026-10-25

**What you'd see:** "Incorrect password" appears visually, but nothing is announced, and the field is not marked invalid.
**Repro:** Admin → wrong password → Unlock.
**Evidence:** `.field-error` has `role: null`, `aria-live: null`; the input has `aria-invalid: null`.
**Proposed fix:** `role="alert"` (or `aria-live="polite"`) on the message, `aria-invalid="true"` plus `aria-describedby` on the input, and keep the message connected to the field.

### F-A11Y-03 — The brand button's name doesn't match its text *(serious)*

**What you'd see / hear:** the logo reads "AssetHub" visually but is announced as "Asset Hub home". WCAG 2.5.3 requires the visible text to be contained in the accessible name.
**Evidence:** Axe `label-content-name-mismatch`, **56 nodes** across the seven scanned surfaces (15 on Search, 15 on mobile search, 15 in the login dialog, 8 on Browse, 1 each on Detail, Admin, and the admin detail panel).
**Proposed fix:** use `aria-label="AssetHub home"` (matching the visible string) or mark the wordmark as decorative text inside a labelled link.

### F-MAINT-04 — A clean checkout cannot build *(high)*

**What you'd see:** clone the repository and you get tests, configs, and docs — but no application. `src/`, `index.html`, and `vite.config.js` were never committed, so `npm run build` fails and every test that renders the app fails with it.
**Repro:** `git clone <repo> /tmp/x && cd /tmp/x && npm ci && npm run build` → Vite has no entry point and exits 1.
**Evidence:** the clean clone contains only `README.md`, `docs/`, `eslint.config.js`, `package*.json`, `playwright.config.js`, `scripts/`, `tests/`, `vitest.config.js`. Recorded as **QC-MAN-01 FAIL** in `docs/quality/manual-checks.md`.
**Why it matters:** the milestone's own success criterion for Phase 1 is "run documented commands from a clean checkout". Today they only work in this working directory, and there is no git recovery point for the product code.
**Proposed fix — scope proven by experiment, not assumption:** commit everything the milestone produced, not just the app folder:

- `src/`, `index.html`, `vite.config.js` — the application
- `tests/frontend/*.test.{js,jsx}`, `tests/browser/*.spec.js` — the 78 + 17 checks
- `package.json`, `package-lock.json` — including the `@axe-core/playwright` dependency, which is currently uncommitted
- `docs/quality/` — the evidence map, baselines, reviews, and this report

**Pre-verification (2026-10-25):** a scratch clone was patched with exactly that set and `npm ci` + `npm run quality` then reported **6/6 gates, 78 frontend tests, 17 browser tests**. Two earlier attempts are informative: with only `src/` injected the checkout passed 6/6 but ran just 2 frontend and 1 browser test (the milestone's suites were missing); with the suites added it failed only because `@axe-core/playwright` was absent from the uncommitted `package.json`. Each attempt isolated one missing piece, so the list above is the minimum that reproduces the milestone. **No application code changes at all.**

---

## Priority 2 — worth fixing, not blocking

### F-A11Y-06 — The search field is named only by its placeholder *(moderate/high)* — ✅ FIXED 2026-10-25

**What you hear:** the field is announced as "Try: Arjun, ep01, sc03", and once you type, any name disappears. The visible `<label>` wraps only an `aria-hidden` glyph, so there is no real label.
**Evidence:** `ariaSnapshot` returns only `placeholder`; tests query by placeholder rather than by name, which is a symptom.
**Proposed fix:** add a visually-hidden `<label for>` or `aria-label="Search assets"`. This also lets the tests move to `getByRole('searchbox', { name: … })`.

### F-UX-02 — Delete confirmation has no way back *(medium)*

**What you'd see:** click Delete once and the button becomes "Confirm delete?" — and stays that way. There is no Cancel, no Escape, and clicking elsewhere does nothing. The only escapes are confirming or navigating away.
**Proposed fix:** add a Cancel button (and Escape) that disarms the confirmation.

### F-UX-04 — "sorted by most relevant" is not true *(medium)*

**What you'd see:** the results header says "14 assets sorted by most relevant", but there is no sorting code at all. Results render in seed order; filtering only removes items.
**Evidence:** `src/components/SearchView.jsx:86-88`; no sort comparator exists anywhere in `src/`.
**Proposed fix:** either implement relevance sorting or change the copy to something true ("14 assets"). Changing the copy is the honest minimum.

### F-UX-03 — Toast messages can describe a stale action *(medium)*

**What you'd see:** a toast lives for 2.4 s. Perform a second action quickly and you read the previous action's message next to the new screen. The admin journey had to assert "not the deletion message" rather than "no message".
**Proposed fix:** key the toast by action, or shorten/queue messages; at minimum make the text unambiguous about what just happened.

### F-DATA-01 — Empty-library and identifier edge cases *(medium)* — ✅ FIXED 2026-10-25

- **Detail falls back to the first asset** (`assets.find(...) ?? assets[0]`). Delete every asset and the Detail view has nothing coherent to show.
- **Publishing uses `Date.now()` for ids.** Two publishes in the same millisecond collide, and the id also feeds the fabricated metadata below.
- **Rejected silently:** `Number(targetScene) || 0` turns garbage into "all scenes"; malformed scene strings are dropped without explaining which token failed.

**Proposed fix:** guard the empty library with an explicit empty state; use a monotonic id (counter or `crypto.randomUUID()`); validate target scene as an integer and report the offending token.

### F-A11Y-07 — Small semantic slips *(minor)*

- The Download button's name is "Download V4 ↓" — the decorative arrow is not `aria-hidden`.
- The asset-type filter group sets `aria-label` on a plain `<div>` with no role, so "Asset type" is never announced as a group.
- The admin panel prints every scene twice ("Used in" and the linked-scenes editor) with the same labels.

**Proposed fix:** hide the arrow, add `role="group"` (or a fieldset) to the filter row, and label one of the two scene lists differently.

### F-DEP-01 — Fonts are fetched from Google at runtime *(low, but easy)*

**What happens:** `src/styles.css:1` imports DM Sans and Manrope from `fonts.googleapis.com`. Every page load makes a third-party request; offline or behind a restrictive CSP, the UI falls back to system fonts and the carefully chosen typography silently changes.
**Evidence:** the only outbound URL in the whole app is that `@import`; there is no other network layer.
**Proposed fix:** self-host both families under `public/` and reference them with `@font-face`. Removes a privacy leak and makes rendering deterministic offline.

---

## Priority 3 — maintainability (report only, no redesign)

| ID | Issue | Evidence | Suggested direction |
|---|---|---|---|
| F-MAINT-01 | `src/App.jsx` owns navigation, admin auth, search derivation, publish, linking, versioning, deletion, and toasts in 306 lines | `src/App.jsx` | Extract hooks (`useAssets`, `useFilters`) before backend work |
| F-MAINT-02 | File metadata is invented from `asset.id % 7` (size, pages, uploader) | `src/lib/assets.js:59-82` | Replace with stored metadata when storage exists |
| F-MAINT-03 | Dependencies pin `latest` for React/Vite/ESLint | `package.json` | Pin exact versions; `npm ci` then reproduces what you tested |
| F-MAINT-05 | Validation is ad-hoc conditionals; no shared schema | `src/App.jsx:178-204` | One schema used by the form and (later) the API |

### React stable-key review (explicitly required)

- **Stable:** asset cards (`asset.id`), filters (`option.value`), tags (`tag`), version thumbnails (version number), manage list (`asset.id`), episode tree (`ep`, `scene`).
- **Index-based:** `DetailView` linked-scene chips use `` `${use.ep}-${use.sc}-${index}` `` and removal is by index. It works today because duplicates are blocked, but it is the one place where an index leaks into identity.
- **Verdict:** no reordering bugs found; the linked-scene chips are the only candidate for a stable key (e.g. a per-use id) if that list ever becomes editable in other ways.

---

## What this report deliberately does **not** say

- It does not claim accessibility is done. `UX-01` ("no serious or critical issues") **cannot** be marked complete while F-A11Y-01 (critical), F-A11Y-02, F-A11Y-03, F-A11Y-04, and F-A11Y-05 (serious) are open.
- It does not treat the in-memory store, `admin123`, or simulated uploads/downloads as defects. They are declared prototype constraints.
- It applies only the four fixes the user approved; everything else below remains a proposal.

---

## Approval table — tick what you want built

Nothing below is applied until you approve it. Fixes will be tested, then shown to you again **before** any commit.

| Approve | ID | Severity | Fix touches | Effort |
|---|---|---|---|---|
| ☐ | F-A11Y-01 | critical | `src/components/BrowseView.jsx` | small |
| ☐ | F-RESP-01 | high | `BrowseView.jsx`, `styles.css` | medium |
| ☐ | F-UX-01 | high | `AdminView.jsx` (truthful control) | small |
| ☐ | F-A11Y-02 | serious | `styles.css` tokens | small (visual change) |
| ☐ | F-A11Y-04 | serious | `Modals.jsx` (focus trap, Escape, restore) | medium |
| ☐ | F-A11Y-05 | serious | `Modals.jsx`, `App.jsx` | small |
| ☐ | F-A11Y-03 | serious | `Header.jsx` | tiny |
| ☐ | F-A11Y-06 | moderate | `SearchView.jsx` | tiny |
| ☐ | F-UX-02 | medium | `DetailView.jsx` | small |
| ☐ | F-UX-04 | medium | `SearchView.jsx` (copy) | tiny |
| ☐ | F-UX-03 | medium | `App.jsx` (toast) | small |
| ☐ | F-DATA-01 | medium | `App.jsx`, `DetailView.jsx` | medium |
| ☐ | F-A11Y-07 | minor | `DetailView.jsx`, `Filters.jsx` | tiny |
| ☐ | F-DEP-01 | low | `styles.css`, `public/` | small |
| ☐ | F-MAINT-04 | **high** | git only (no app change) | tiny |

**Reply with the IDs you approve** (for example: "approve all Priority 1, plus F-A11Y-06 and F-UX-04"). Anything not approved stays exactly as it is and is recorded as deferred.
