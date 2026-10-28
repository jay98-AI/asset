# Asset Hub Progress

## Current checkpoint — C.1, 2026-10-28

LAST COMPLETED: C.1 — created `CHECKPOINT.md`, the page-by-page frontend/backend map for application commit `71a6405`, with 12 views/components, source evidence, requirement/phase links, proposed APIs/records, required states, server rules and known gaps. AGENTS now requires reading/updating it with affected page/backend changes. Current prototype behaviour is distinguished from proposed backend contracts; older role/schema/planning inconsistencies are called out for R.0/R.1.

NEXT STEP: finish R.0, then push. Existing `.gitignore` edits and staged `dist/` untracking remain outside this documentation commit. This is documentation-only; no application changes or test reruns were required. Lint/Vitest status remains unverified as recorded below.

## Review & Approval frontend prototype — 2026-10-28

The owner requested implementing the supplied review design as an in-memory frontend prototype before backend work. The new screens cover three role modes, super-admin review queues (Waiting, Not approved, Approved, Recent edits), side-by-side version comparison, required rejection notes, chronological append-only review threads and replies, corrected upload rounds, and per-role in-app notifications with unread counts and Mark all as read. Super-admin uploads record automatic approval in the thread. Admin edits appear immediately and feed Recent edits. Member UI retains the last approved version, excludes rejected versions, and hides rejected new assets. This is a browser demonstration, not server-enforced visibility or real authentication; all review state resets on refresh.

The demo retains the current library's Arjun V4 while adopting the reference's review rounds and approved V1. Desktop layout targets 1440px and 1280px. Six direct review-rule assertions and syntax checks of 12 edited files passed. All 21 distinct browser checks passed across runs; the four new review browser tests passed twice and screenshots at both target widths were visually reviewed. The initial browser run passed 19/21; the accessibility check and admin journey then passed on retries (the admin journey's publish message expectation was updated for review status).

Verification limits: full lint hit a generated test-results folder scan race, and the retry excluding generated folders stalled. The initial Vitest run passed 48 tests but had four missing-browser-environment failures in the new test file and four worker startup timeouts. Its environment annotation was fixed; one-worker retries stalled and were stopped. Lint and Vitest are not reported as passing. No production build was run for this feature. The upload page can select/drop a local filename for the demo; actual file bytes are not stored. Add-version selection remains simulated.

R.0 is still incomplete; its ignore changes and staged dist untracking remain separate. R.1 approved-documents and backend planning updates remain pending. No backend or permanent storage has been added.

Open issue: Production build takes ~2 min; vite:css transform 102s. Suspected internet font loading (Google Fonts) in the redesign. Fix before launch; the office app must not depend on the internet. The font-loading cause is unconfirmed.

---

**Live tracker:** use this file for the current delivery status. From 2026-10-26, GSD drives planning; `.planning/` is live.

| Director stage | Status | Notes |
|---|---|---|
| 0. Brief | ✓ Approved | See `docs/BRIEF.md` |
| 2. Skill Scout | Pending | A.4 will vet the installed skills |
| 4. Structure | ✓ Approved — 2026-10-26 | See `docs/STRUCTURE.md` |
| 5. Wireframe | ✓ Complete | Discovery wireframes are retained in `reference/discovery/` |
| 6. Design | ✓ Refined — 2026-10-27 | Slack-inspired workspace shell with an optional compact navigation rail, grouped navigation, and a persistent accessible light/dark theme switch; Browse retains its project/episode/scene workspace panel |
| 7. Features (frontend) | ✓ Complete — v1.0 | Search, browse, details, prototype admin, testing, and voice-over preview |
| 8. Backend & Data | Active — build order 8A–8D | Local persistence, admin accounts, uploads, Trash, and previews |
| 9. QA | Planned | Existing accessibility findings plus a Cancel button in delete confirmation |
| 10. Launch on office network | Later | Host choice, network access, HTTPS research, guest-Wi-Fi isolation, backups, and migration procedure |

## Backend & Data: v1.1 build order

### 8A — Local Persistence Foundation (GSD Phase 6)

- `PERS-01`: persist projects, assets, versions, and scene links in SQLite after restart.
- `PERS-02`: copy uploaded files into a managed project/asset/version folder structure.
- `PERS-03`: return stable IDs, metadata, relationships, and safe file URLs through the local API.
- `SAFE-01`: sanitize names and paths; block directory escape and unrelated overwrites.
- `RUN-01`: document one local command that initializes storage and starts frontend plus API.
- `STOR-01`: storage folder location and max upload size (default 50 MB) are settings in `.env`, not code.
- `STOR-02`: the schema includes admins, activity log, `created_by`/`updated_by`/`uploaded_by`, and Trash fields from the start.
- `STOR-03`: report free disk space where storage is created.

**Planning status (2026-10-26):** six plans written and revised after the GSD check (06-01 tracer + schema, 06-02 full library graph, 06-03 managed storage, 06-04 API + safe file links, 06-05 one run command, 06-06 quality gate). Not yet re-checked or executed. Independent review fixes applied 2026-10-26: ignored `local-data/` folder with a `git check-ignore` test and the existing `.env.example` edited, not recreated (06-02); activity log with plain IDs and no foreign keys, plus a permanent-delete test (06-01); friendly missing-`.env` message (06-05); setting renamed `ASSET_MIN_FREE_SPACE` (06-03).

**Owner decisions (2026-10-26):**

- Q1: a storage write is refused if free space after it would fall below `ASSET_MIN_FREE_SPACE` (default 5 GB, set in `.env`). Startup still reports free space; the visible admin warning is Phase 7. (06-03)
- Q2: use Node's built-in SQLite (Release Candidate) behind one boundary; update to and pin the latest Node 24.x LTS (`engines` + `.nvmrc`) before execution; review again in Phase 6.1, fallback `better-sqlite3`. (06-01)

### 8B — Admin accounts & activity log (GSD Phase 6.1, new)

- `ACCT-01`: each admin has their own username and password; passwords are stored only as secure hashes.
- `ACCT-02`: the first admin is created by a one-time local setup command, not through the website.
- `ACCT-03`: viewing needs no login; every change action requires a logged-in admin, checked on the server. Hiding buttons is not enough.
- `ACCT-04`: the prototype admin password is removed from the code entirely.
- `ACCT-05`: logout works; sessions end after 8 hours of inactivity.
- `ACCT-06`: admins can add and disable other admins.
- `AUDIT-01`: every upload, edit, version, scene-link change, delete, restore, Trash empty, login, and account change is recorded: who, what, which asset, when.
- `AUDIT-02`: admins can view the activity history, newest first, filterable by asset.
- `AUDIT-03`: activity records cannot be edited or deleted through the app.

### 8C — Real Uploads, Persistent Library, and Trash (GSD Phase 7)

- `UPLD-01`: drag/drop and file-picker uploads with validation, progress, success, and failure feedback.
- `UPLD-02`: select supported files with the computer's file picker.
- `UPLD-03`: upload validation, progress, success, and failure messages are clear and visible.
- `LIB-01`: show newly uploaded assets immediately in Search, Browse, and Admin.
- `LIB-02`: retain uploaded assets after browser and server restart.
- `LIB-03`: persist version, scene-link, edit, and delete actions consistently across SQLite records and managed files.
- `TRASH-01`: delete moves the asset and all its version files to Trash; it disappears from Search/Browse.
- `TRASH-02`: admins can view Trash and restore an asset with all its versions and scene links.
- `TRASH-03`: emptying Trash (one item or all) is permanent, needs a typed confirmation, is admin-only, and never happens automatically.

**Note (Phase 6 review, 2026-10-26):** the Vite dev server must forward `/api` requests to the local API.

### 8D — Preview and end-to-end local workflow (GSD Phase 8)

- `PREV-01`: image preview or thumbnail.
- `PREV-02`: inline PDF preview and original-file access.
- `PREV-03`: listed, seekable voice-over/audio playback with duration.
- `PREV-04`: open or download the original stored file.

**Note (Phase 6 review, 2026-10-26):** the file route must support byte-range requests so audio can seek.

**Mapping note:** 8A–8D map to final GSD v1.1 Phases 6, 6.1, 7, and 8 respectively (8B is new).

## QA

Existing open items: colour contrast, brand naming, and dialog focus handling. Delete confirmation also needs a Cancel button.

Open issue: `package.json` lists dependencies as `"latest"`; pin exact versions before launch.

## Open Issues

Phase 6.1 / ACCT-04 must remove the prototype password from every tracked file:

- `README.md`
- `docs/quality/findings-report.md`
- `docs/quality/fix-approval.md`
- `reference/discovery/Asset Hub.dc.html`
- `src/App.jsx`
- `src/components/Modals.jsx`
- `tests/browser/accessibility-baseline.spec.js`
- `tests/browser/admin-journey.spec.js`
- `tests/browser/responsive.spec.js`
- `tests/frontend/admin-flows.test.jsx`

## Stage 10 — Launch on office network (later)

- Choose the host machine.
- Open access to the office network.
- Research an HTTPS approach for secure admin logins over the network.
- Check that guest Wi-Fi cannot reach the app.
- Set up database and file backups.
- Document the procedure to move to another computer.

## Later

- A shareable link per asset.
- Video files.

## Current Next Step

1. Owner updates Node to the latest 24.x LTS.
2. Decide whether to split the non-blocking GSD warning in Phase 6 plan 06-03 (four tasks); all requirements and approved fixes passed the check.
3. If accepted as-is, refresh `.planning/STATE.md` through GSD and execute Phase 6 in Codex.

`.planning/STATE.md` is stale — refresh it with GSD, do not hand-edit. Planning files are tracked in Git except for the three historical files that contain the prototype password.
