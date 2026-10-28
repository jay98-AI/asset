# Asset Hub — Project Instructions

## Purpose

Asset Hub is an internal application for creative production teams to find, inspect, upload, preview, and manage approved production assets. The finished application is intended for office-network use by other team members.

## Current Stage

The completed v1.0 milestone tested and hardened the React prototype. Stage 8A is next (planning): a Node.js API, SQLite metadata, and managed local file folders are in scope. No backend or persistent storage has been implemented yet.

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

GSD (`.planning/`) is the live planning workflow. `docs/BRIEF.md` and `docs/STRUCTURE.md` hold the owner's approved decisions; `.planning/` must stay consistent with them.

GSD SAFETY LIMITS: never use YOLO / auto-approve mode · never run download-and-run commands (curl|bash, wget|sh) or install anything without asking the owner · never use git --no-verify · never update GSD automatically; update only when the owner asks · after each GSD plan or phase completes, update HANDOFF.md and docs/PROGRESS.md so another agent can take over.

Never write the prototype admin password value into any file; refer to it only as 'the prototype password'.

## Target and Open Decision

- Target: other users on the office network, with a Node.js API, SQLite, and managed file folders.
- Visitors have no login and can search, browse, view, preview, and download. One to three named admins have individual logins for all changes; their immutable activity log is admin-readable, and deletion moves assets to recoverable Trash.

## Project Rules

- Read CHECKPOINT.md before changing any page or adding backend work, and keep it updated in the same commit.
- Make one change per request and touch only what the request asks for.
- Explain work in plain English.
- After every working step, commit it and update `docs/PROGRESS.md` and `HANDOFF.md`.
- Never put secrets or real passwords in code. The current prototype admin password is temporary and must be replaced, not reused.
- Every page must handle empty, loading, and error states.
- Check desktop and phone widths for interface changes.
- Keep the server bound to this PC until the planned network step.
- Uploads may never write outside the managed storage folder.
- Deletes need a confirmation and a server-side check.
