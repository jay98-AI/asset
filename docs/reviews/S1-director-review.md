# S1 Director Review Packet

**Prepared:** 2026-10-26 12:03 IST  
**Scope:** Current frontend prototype and recorded v1.1 plan. This packet contains facts only. Statements are marked **CONFIRMED** when seen in source, tests, or configuration; they are marked **PLANNED/ASSUMED** when they come from planning material or are an inference.

## 1. STRUCTURE

**Source:** `docs/STRUCTURE.md` — **PLANNED/ASSUMED** where it describes v1.1; current prototype statements are corroborated in `src/`.

```md
# DRAFT — awaiting owner approval

# Asset Hub Structure

## Pages and URLs

Asset Hub is currently a single-page React application. It does not use URL routes yet; views change inside the app at `/`.

| View | URL | Purpose |
|---|---|---|
| Search | `/` | Find assets by text, tags, episode, scene, project, and type filters. |
| Browse | `/` | Browse a project by episode and scene. |
| Asset detail | `/` (in-app state) | Inspect asset metadata, versions, related scenes, and available preview/download actions. |
| Admin workspace | `/` (in-app state) | Publish prototype metadata, open assets, manage versions, scene links, and deletion. |

## Navigation

- The header provides **Search** and **Browse** for every visitor.
- Selecting **Admin** opens the temporary prototype admin gate.
- After entry, the **Upload** navigation item opens the admin workspace.
- Opening an asset from Search, Browse, or Admin shows the detail view; Back returns to the previous in-app view.

## Key User Flows

### Member: find and inspect an asset

1. Open Search.
2. Enter a name, tag, episode, or scene query, then optionally filter by project, episode, scene, or type.
3. Open an asset card.
4. Inspect its metadata, usage, version list, and supported preview.
5. Select one or more assets and start the current prototype download action.

### Member: browse by production location

1. Open Browse.
2. Choose a project, then an episode and scene.
3. Filter the displayed assets by type if needed.
4. Open an asset for details.

### Admin: manage prototype asset metadata

1. Choose Admin and pass the temporary prototype gate.
2. Open Upload.
3. Enter project, asset type, name, scene use, and optional metadata.
4. Publish the metadata into the in-memory prototype library.
5. Open an asset to add a version, link or remove scenes, or confirm deletion.

## Roles Today

| Role | Can read | Can change |
|---|---|---|
| Visitor/member | All seeded and in-memory asset information | Search filters, selection, and local in-browser state only |
| Prototype admin | All asset information | In-memory asset metadata, versions, scene links, and deletion after the temporary gate |

There is no real login, authorization, server audit trail, or persistent data yet.

## Planned Data for v1.1

| Planned record | What it holds | Who can read and change it |
|---|---|---|
| Projects | Stable ID and project name used to group assets | Access policy is undecided until the office-network login approach is chosen. |
| Assets | Stable ID, project, name, type, metadata, current version, and safe managed-file reference | The planned API will read and change it; final user permissions are undecided. |
| Asset versions | Version number, file metadata, and the stored-file reference for each revision | The planned API will add and expose versions; permissions are undecided. |
| Scene links | Asset-to-episode and asset-to-scene relationships | The planned API will read and change links; permissions are undecided. |
| Managed files | The original image, PDF, or audio binary, organized by project, asset, and version | Files stay within the managed storage folder; direct user access rules are undecided. |

SQLite will hold metadata and relationships. Managed local folders will hold file binaries. Phase 6 establishes that foundation; Phase 7 connects real uploads and library actions; Phase 8 adds image, PDF, and voice-over/audio preview workflows.
```

## 2. PAGES & ROUTES (ACTUAL)

**Sources:** `src/App.jsx`, `src/components/Header.jsx`, `src/components/SearchView.jsx`, `src/components/BrowseView.jsx`, `src/components/DetailView.jsx`, `src/components/AdminView.jsx`, `src/components/Modals.jsx` — **CONFIRMED**.

The application has one browser URL (`/`) and no router. The following are React in-app views.

| URL / view | What it shows | Actions offered | Who can reach it |
|---|---|---|---|
| `/` — Search | Search field, facets, matching asset cards, current selection, and prototype download controls | Search; filter by project, episode, scene, and type; open an asset; select assets; initiate simulated ZIP download | Visitor and prototype admin |
| `/` — Browse | Project, episode, scene, and type selectors with matching assets | Choose location/type; open an asset | Visitor and prototype admin |
| `/` — Detail | Asset metadata, uses, version buttons, related information, preview area, and actions | Return to prior view; select simulated version; initiate simulated download; prototype admins can change versions, scenes, and delete | Visitor can inspect; prototype admin gets management controls |
| `/` — Admin login modal | Temporary password entry and error message | Submit temporary password; close modal | Any visitor can open it; only the client-side password comparison grants admin state |
| `/` — Admin workspace | Metadata publishing form and project management controls | Create a project name; publish in-memory metadata; open assets | Prototype admin only |
| `/` — Upload (header action) | Opens the existing Admin workspace; it is not a separate route or real upload page | Navigate to Admin workspace | Prototype admin only |

## 3. CURRENT DATA SHAPE

**Sources:** `src/data/assets.js`, `src/lib/assets.js`, `src/App.jsx`, `src/components/DetailView.jsx` — **CONFIRMED**.

### Asset record

| Field | Type | Example value |
|---|---|---|
| `id` | number | `1` |
| `project` | string | `Moonlit Harbor` |
| `name` | string | `Arjun – Character Sheet` |
| `type` | string | `Character Sheet` |
| `ep` | number | `1` |
| `sc` | number | `3` |
| `chars` | string array | `["Arjun"]` |
| `loc` | string | `Harbor` |
| `props` | string array | `["Lantern"]` |
| `ver` | number | `1` |
| `also` (optional) | array of `{ ep: number, sc: number }` | `[{ ep: 1, sc: 4 }]` |
| `model` (optional) | string | `NOT FOUND in every seed record` |
| `prompt` (optional) | string | `NOT FOUND in every seed record` |
| `audio` (optional) | string URL | `NOT FOUND in seed records`; the detail view can use it if supplied |

`sc: 0` is used by the helper logic as an episode/all-scenes use rather than a numbered scene. `also` adds further scene uses to the primary `ep`/`sc` pair.

### Related frontend data

| Data | Type / current values | Example |
|---|---|---|
| Asset types | string constants | `Character Sheet`, `Location`, `Keyframe`, `Script`, `Storyboard`, `Voice-over` |
| Type hues | object of type-to-number mappings | `Character Sheet` maps to a hue number used by the UI |
| Projects | derived string list; no separate project records | `Moonlit Harbor` |
| Episode/scene options | derived from asset uses | Episode `1`, scene `3` |
| Filters | local React state | selected project/episode/scene/type facets |

There is no database schema, API record, real file record, category table, tag table, or separate project model in the current frontend.

## 4. ADMIN TODAY

**Sources:** `src/App.jsx`, `src/components/Header.jsx`, `src/components/AdminView.jsx`, `src/components/DetailView.jsx`, `src/components/Modals.jsx` — **CONFIRMED**.

- The gate is a hard-coded, browser-side comparison in `src/App.jsx`; the temporary password value is present in source and is represented here only as `admi…`.
- Passing it sets local React admin state only. There is no account, session, server check, authorization, audit trail, or persistence.
- An admin can publish a new asset metadata record to the current browser-memory asset list after required-field validation, and can enter a new project name.
- An admin can increment an asset version. The current “file choice” is simulated: it derives a display extension from asset type and does not read, upload, or store a file.
- An admin can add and remove scene links in browser memory.
- An admin can delete an asset in browser memory after a two-step confirmation state. The current confirmation flow has no cancel action.
- Refreshing the page loses all admin changes.

## 5. FILE HANDLING TODAY

**Sources:** `src/App.jsx`, `src/components/AdminView.jsx`, `src/components/DetailView.jsx`, `src/lib/audio.js` — **CONFIRMED**.

| Area | Current behavior |
|---|---|
| Drag-and-drop | Not implemented. |
| Computer file picker | Not implemented. |
| Accepted file types / MIME validation | Not implemented. No accept list or MIME validation exists. |
| Size limit | NOT FOUND; no file-size check exists. |
| Asset publishing | Saves metadata only in React memory. It does not copy a file. |
| Version “upload” | Simulated. It increments `ver` and chooses a display extension (`wav` for Voice-over, `pdf` for Script/Storyboard, otherwise `png`). |
| Image/PDF preview | A generic visual placeholder, not the actual stored image or PDF. |
| Voice-over/audio preview | An HTML audio player. If no `asset.audio` URL exists, `src/lib/audio.js` creates an in-browser PCM WAV data URL. |
| Download / Download ZIP | Toast-only prototype actions; no file is downloaded. |
| Delete | Removes the metadata record from browser memory only; there is no disk file to remove. |

## 6. v1.1 PLAN

**Sources:** `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` — **PLANNED/ASSUMED**. The following requirement text and success criteria are copied from those files.

### Phase 6 — Local Persistence Foundation

**Goal:** The app has a safe local storage foundation that survives restarts.

**Requirements:**

- `PERS-01`: Project, asset, version, and scene-link records persist in SQLite after app restarts.
- `PERS-02`: Uploaded files copied into managed local folder organized project/asset/version.
- `PERS-03`: local API returns stable IDs metadata relationships safe file URLs.
- `SAFE-01`: names/path sanitized no escape/overwrite unrelated.
- `RUN-01`: one documented local command initializes storage/frontend/API.

**Success criteria:**

1. One documented local command starts React frontend and Node API and creates DB and managed storage if needed.
2. projects/assets/versions/scene links API records persist after server restart.
3. stored files stable IDs safe URLs, unsafe paths/unintended overwrite rejected.

### Phase 7 — Real Uploads and Persistent Library

**Goal:** Users can add and manage real files through the existing Asset Hub interface.

**Requirements:**

- `UPLD-01`: drag/drop support.
- `UPLD-02`: select with computer picker.
- `UPLD-03`: validation/progress/success/failure clear/visible.
- `LIB-01`: new assets immediate search browse admin.
- `LIB-02`: restart browser/server.
- `LIB-03`: version, scene link, edit/delete actions keep SQLite/files consistent.

**Success criteria:**

1. drag/drop/picker both uploads supported files feedback
2. upload immediate appears search browse admin persists across browser/server restart
3. edit/version/link/delete persist and no broken db records/unmanaged files.

### Phase 8 — Preview and End-to-End Local Workflow

**Goal:** Users can inspect and open the important production file types stored on the PC.

**Requirements:**

- `PREV-01`: supported images useful preview/thumbnail.
- `PREV-02`: PDFs inside/open original.
- `PREV-03`: voice/audio listed/playable duration/seek.
- `PREV-04`: open/download stored original.

**Success criteria:**

1. Image useful previews, PDFs inline and originals open/download
2. VO/audio listed playable duration/seek
3. automated manual checks prove upload restart search preview version link delete E2E.

## 7. CONFIDENCE TABLE

**Sources:** `docs/STRUCTURE.md`, `src/App.jsx`, `src/components/`, `src/data/assets.js`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`.

| Part of `docs/STRUCTURE.md` | Status | Source |
|---|---|---|
| Single-page app; views change at `/` | CONFIRMED | `src/App.jsx`, no router dependency in `package.json` |
| Search, Browse, Detail, and Admin views | CONFIRMED | `src/App.jsx`, `src/components/` |
| Header navigation and admin-gated Upload action | CONFIRMED | `src/components/Header.jsx`, `src/App.jsx` |
| Member search/browse flow | CONFIRMED | `src/components/SearchView.jsx`, `src/components/BrowseView.jsx` |
| Detail inspection and selection/download flow | CONFIRMED, except actual file download | `src/components/DetailView.jsx`, `src/App.jsx` |
| Admin metadata/version/scene/delete flow in memory | CONFIRMED | `src/App.jsx`, `src/components/AdminView.jsx`, `src/components/DetailView.jsx` |
| Visitor and prototype-admin role table | CONFIRMED | `src/App.jsx` client-side admin state |
| No real login, authorization, server audit trail, or persistence | CONFIRMED | `src/`, `package.json` |
| Planned v1.1 projects/assets/versions/scene links/managed files | PLANNED/ASSUMED | `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` |
| SQLite metadata and managed local binary folders | PLANNED/ASSUMED | `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `AGENTS.md` |

## 8. MISMATCHES

**Sources:** `docs/STRUCTURE.md`, `AGENTS.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `src/`.

1. **CONFIRMED:** `docs/STRUCTURE.md` says a member can inspect a “supported preview.” Actual image and PDF areas are generic placeholders; only the voice-over player can play generated or supplied audio. Source: `src/components/DetailView.jsx`, `src/lib/audio.js`.
2. **CONFIRMED:** `docs/STRUCTURE.md` calls the version display a “version list.” The current UI derives buttons from one `ver` number; it has no version-record history or stored version files. Source: `src/App.jsx`, `src/components/DetailView.jsx`.
3. **CONFIRMED:** `AGENTS.md` says every page must handle loading and error states. The current app has local validation and empty states, but no asynchronous loading state because no API exists. Source: `AGENTS.md`, `src/`.
4. **PLANNED/ASSUMED:** `.planning/STATE.md` calls the present work “Phase: 6 of 8,” while the v1.1 roadmap presents three phases numbered 6–8. This appears to be inherited overall numbering and is potentially confusing, not evidence of a missing phase. Source: `.planning/STATE.md`, `.planning/ROADMAP.md`.
5. **CONFIRMED (historical):** `docs/quality/fix-approval.md` records backend/storage as out of scope for completed v1.0; v1.1 planning brings it into scope. These statements apply to different milestones. Source: `docs/quality/fix-approval.md`, `.planning/ROADMAP.md`.

## 9. QUESTIONS FOR THE OWNER

**Sources:** `AGENTS.md`, `docs/STRUCTURE.md`, `.planning/REQUIREMENTS.md` — **PLANNED/ASSUMED questions; no answer was found in the repository.**

1. On the office network, who may upload, edit, and delete assets?
2. Should people have individual accounts, or should there be one shared admin login?
3. When an asset is deleted, what should happen to its original files and prior-version files on disk: delete, retain, archive, or ask first?
4. Roughly how many files will the library hold, and what are the usual and largest file sizes?
5. Which computer will host the app for the office, and will it remain on during work hours?
6. Which file types beyond images, PDFs, and voice-over audio must be supported in the first persistent release?
7. Do staff need an audit history of who changed or deleted an asset?

## 10. SKILL FACTS (FOR VETTING; NO VERDICT)

### GSD workflow suite

**Sources:** `.codex/skills/`, `.codex/gsd-core/`, `SKILLS.md` — **CONFIRMED**, except where labelled otherwise.

- **Install path and count:** `.codex/skills/`; 72 `SKILL.md` files were found.
- **Source and version:** `.codex/gsd-core/package-identity.cjs:9-10` records `https://github.com/open-gsd/gsd-core`; `.codex/gsd-core/VERSION` records `1.18.0`. A separate publisher field is **NOT FOUND**.
- **Skill scripts:** no `scripts/` directory was found inside the GSD skill folders. Runtime scripts are under `.codex/gsd-core/bin/` and `.codex/scripts/`.
  - `check-latest-version.cjs` and `gsd-check-update*.js` check for version updates.
  - `ensure-runtime-build.cjs` checks/builds the runtime.
  - `gsd-tools.cjs` and `gsd_run` dispatch GSD commands.
  - `verify-reapply-patches.cjs` verifies patch reapplication.
  - `.codex/scripts/` contains maintenance scripts for changesets, CLI parsing/rendering, release notes, linting, capability registry generation, loop-host contracts, and slash-command repair.
- **Network calls observed:**
  - `.codex/gsd-core/workflows/update.md:225-226` instructs `curl`/`wget` against GitHub raw content for an update changelog.
  - `.codex/scripts/lib/shellcheck-fetch.cjs:203` downloads a ShellCheck GitHub release.
  - `.codex/gsd-core/bin/lib/commands.cjs:2984` references the Brave API.
  - `.codex/gsd-core/bin/lib/package-legitimacy.cjs:178,211` references npm registry/API endpoints.
  - `.codex/gsd-core/workflows/review.md:120` includes `curl -fsSL antigravity.google/cli/install.sh | bash` as a review-lane instruction.
- **Environment/secrets/credentials reads:** `.codex/gsd-core/workflows/settings-integrations.md:14-28` documents storing integration API keys in `.planning/config.json` and masking displayed values. Other environment references occur in runtime tooling. A project `.ssh` or credentials-file read was **NOT FOUND** in the reviewed skill instructions.
- **Broad shell commands observed:** `.codex/gsd-core/workflows/sync-skills.md:150,246-254` documents guarded file removal/copy when `--apply` is chosen. The update and review workflow lines above also contain download-and-shell commands.
- **Instructions to bypass safeguards observed:** `.codex/gsd-core/workflows/quick/steps/worktree-pre-dispatch-commit.md:39-47` permits `git commit --no-verify` only when `workflow.worktree_skip_hooks=true`; `.codex/gsd-core/workflows/new-project.md:470` offers a `YOLO (Recommended), Auto-approve, just execute` choice. `.codex/gsd-core/workflows/execute-plan.md:316-320` says not to use `--no-verify` by default.
- **Hidden, encoded, or obfuscated text:** no hidden or encoded payload was found in the reviewed workflow and skill text. Generated runtime/vendor-like files exist and were not treated as human-authored workflow instructions.
- **Project files written when used:** GSD planning commands write under `.planning/` (roadmap, state, phase, quick, and codebase subfolders). Code-execution skills can also write the files explicitly assigned by their selected plan. Source: `.codex/skills/*/SKILL.md`, `AGENTS.md`.

### UI/UX Pro Max

**Sources:** `/Users/jay.98/.codex/skills/ui-ux-pro-max/` — **CONFIRMED**, except where labelled otherwise.

- **Install path and count:** `/Users/jay.98/.codex/skills/ui-ux-pro-max/`; 73 files were found.
- **Publisher/source/version:** **NOT FOUND** in its local `SKILL.md` and package files.
- **Scripts and purpose:**
  - `scripts/core.py` searches the local design catalog.
  - `scripts/search.py` provides the command-line search and design-system options.
  - `scripts/design_system.py` creates and can persist a Markdown design-system result.
  - `scripts/reasoning_contract.py` validates required reasoning-rule tokens.
  - `scripts/validate_data.py` validates local catalog data and URL shapes.
  - `scripts/tests/test_*.py` test catalog, data contract, core search, design system, taxonomy, paths, and relevance behavior.
- **Network calls:** no HTTP/network client call was found in the reviewed main Python scripts. `validate_data.py` handles URL strings but does not fetch them.
- **Environment/secrets/credentials reads:** `scripts/design_system.py:640` reads `COLORTERM`; no `.ssh`, secrets, or credentials-file read was found in the reviewed scripts.
- **Broad shell commands:** none found in the documented normal Python invocation.
- **Instructions to ignore rules, skip permissions, auto-approve, or hide actions:** none found. `SKILL.md:63` states that the skill does not override other rules.
- **Hidden, encoded, or obfuscated text:** none found in the reviewed skill text and scripts.
- **Project files written when used:** normal search is read-only. With `--persist`, `SKILL.md:90-104` and `scripts/design_system.py:997-1017` write `design-system/<slug>/MASTER.md` and page files under the chosen output directory; `--force` can overwrite a prior generated output, while the skill says not to use it without authorization.

## 11. PROJECT SETUP

**Sources:** `package.json`, `node --version`, `AGENTS.md`, `CLAUDE.md` — **CONFIRMED**.

### package.json scripts

| Script | Command |
|---|---|
| `dev` | `vite` |
| `build` | `vite build` |
| `preview` | `vite preview` |
| `lint` | `eslint .` |
| `test:frontend` | `vitest run` |
| `test:frontend:watch` | `vitest` |
| `test:browser` | `playwright test` |
| `test:browser:install` | `playwright install chromium` |
| `quality:tracer` | `npm run build && npm run test:browser` |
| `test:tooling` | Node tooling tests |
| `test:traceability` | Requirement-evidence validation |
| `quality` | `node scripts/run-quality.mjs` |

### Installed top-level dependencies

| Dependency | Version |
|---|---|
| `react` | `19.3.1` |
| `react-dom` | `19.3.1` |
| `vite` | `8.3.5` |
| `@vitejs/plugin-react` | `6.1.2` |
| `eslint` | `10.13.0` |
| `@eslint/js` | `10.0.1` |
| `eslint-plugin-react-hooks` | `7.1.1` |
| `eslint-plugin-react-refresh` | `0.5.7` |
| `globals` | `17.13.0` |
| `vitest` | `5.0.5` |
| `jsdom` | `30.1.3` |
| `@testing-library/react` | `16.3.3` |
| `@testing-library/dom` | `10.4.2` |
| `@testing-library/jest-dom` | `7.0.1` |
| `@playwright/test` | `1.64.1` |
| `@axe-core/playwright` | `4.14.0` |

**Installed Node.js:** `v24.15.0`.

### Current `AGENTS.md`

```md
# Asset Hub — Project Instructions

## Purpose

Asset Hub is an internal application for creative production teams to find, inspect, upload, preview, and manage approved production assets. The finished application is intended for office-network use by other team members.

## Current Stage

The completed v1.0 milestone tested and hardened the React prototype. v1.1 is now at Phase 6, **Local Persistence Foundation**: a Node.js API, SQLite metadata, and managed local file folders are in scope. No backend or persistent storage has been implemented yet.

## Stack

- Frontend: React and Vite
- Tests: Vitest, Testing Library, Playwright, and axe
- Planned backend: Node.js API with SQLite
- Planned storage: managed local folders for file binaries; SQLite for metadata and relationships
- Current hosting: Vite on this PC only (`127.0.0.1`)

## Folder Map

- `src/` — React application, components, styles, seeded data, and pure helpers
- `tests/` — frontend, browser, and tooling tests
- `docs/` — quality evidence and the live project tracker
- `reference/` — discovery artifacts and legacy reference material, excluded from linting
- `.planning/` — GSD roadmap, requirements, state, and phase plans
- `scripts/` — quality and requirement-evidence tools

## Run and Test Commands

```bash
npm run dev
npm run lint
npm run build
npm run test:frontend
npm run test:browser
npm run quality
```

## Planning

`.planning/` holds the GSD roadmap and phase plans. It is the source of plan content and is kept as history; do not delete it. `docs/PROGRESS.md` is the live tracker.

## Target and Open Decision

- Target: other users on the office network, with a Node.js API, SQLite, and managed file folders.
- Open decision: the login approach for network use has not yet been decided.

## Project Rules

- Make one change per request and touch only what the request asks for.
- Explain work in plain English.
- After every working step, commit it and update `docs/PROGRESS.md` and `HANDOFF.md`.
- Never put secrets or real passwords in code. The current prototype admin password is temporary and must be replaced, not reused.
- Every page must handle empty, loading, and error states.
- Check desktop and phone widths for interface changes.
- Keep the server bound to this PC until the planned network step.
- Uploads may never write outside the managed storage folder.
- Deletes need a confirmation and a server-side check.
```

### Current `CLAUDE.md`

```md
@AGENTS.md
```
