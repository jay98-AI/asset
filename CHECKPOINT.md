# Asset Hub — Page-by-page checkpoint

Last updated: 2026-10-28 · at commit 71a6405

Purpose: give every agent one reference for each page's purpose, its current frontend behaviour, the data it uses, and its future backend connections. The commit above is the application snapshot inspected for this document, not the later documentation commit containing this file.

Read before changing any page or adding backend work. Update the affected page section in the same commit as any change to that page or its backend.

## Status legend and evidence

- **BUILT** = exists in the inspected code. Specify whether it is an in-memory prototype or a real backend. All built views below are currently frontend prototypes; there is no real backend, database or API integration.
- **PROPOSED** = planned, not yet decided in detail; confirm when that phase is planned. Never present a PROPOSED item as decided. Every API method/path in this file is PROPOSED; none is implemented.
- **UNKNOWN — check** = the available code/documents do not settle the detail. Resolve it during the relevant planning step.

Sources: `src/App.jsx`, `src/components/`, `src/data/assets.js`, `src/lib/assets.js`, `src/lib/audio.js`, `src/lib/reviews.js`, `docs/BRIEF.md`, `docs/STRUCTURE.md`, `docs/PROGRESS.md`, `HANDOFF.md`, and application commit `71a6405`. No `reference/design-review-approval/` folder is present in this checkout; do not claim the reference was saved here. The handoff used for the prototype is outside the repository at `/Users/jay.98/Downloads/handoff-review/`.

All current views share `/`; `App.jsx` switches an in-memory `view` value. API paths proposed below are server resources, not existing frontend routes. Browser deep links and URL routing are **UNKNOWN — check** during planning.

### Document and requirement provenance

`docs/BRIEF.md` and `docs/STRUCTURE.md` still describe Visitor/Admin and equal admins. They predate the owner's 2026-10-28 Member/Admin/Super admin decisions and the prototype. R.1 must reconcile those documents. Their old rule allowing any admin to manage accounts must not override the newer super-admin-only owner decision.

Existing requirement IDs and phase labels below come from `docs/PROGRESS.md`: Phase 6 (8A), 6.1 (8B), 7 (8C), and 8 (8D). `ROLE-01`–`ROLE-02`, `REV-01`–`REV-09`, `NOTIF-01`–`NOTIF-02`, and `UI-01` come from the owner's 2026-10-28 decisions in this chat; formal recording in the approved documents/plans is pending R.1. The Review & Approval phase's number and exact build order are **UNKNOWN — check**. Phase assignments here map intended responsibilities; they are not executable plans. `.planning/` was lost in the re-clone and has not been recreated.

### Database record vocabulary

`docs/STRUCTURE.md` lists these planned logical records: **Projects, Assets, Versions, Scene links, Admins, Activity log**. No SQL tables exist in the application. Physical table names, keys, migrations and detailed relationships are **PROPOSED / UNKNOWN — check** during Phase 6 planning.

The review feature additionally needs **PROPOSED** Review threads, Review entries, and Notifications records; these are not yet in STRUCTURE. Session storage for real login is also **PROPOSED**. Review status on assets/versions, last approved version, account role and notification ownership need schema design; do not treat the current JavaScript object shape as an approved SQL schema.

## Roles summary

| Role | Current reach — BUILT prototype | Intended server access — owner decisions, implementation pending |
|---|---|---|
| Member | Search, Browse, permitted Asset detail, selection and download simulations; sample audio playback. No bell, review badges, thread or Review page. | No login; read/download only member-visible assets and allowed versions. |
| Admin | After the prototype gate: Upload/library, asset metadata and scene-link changes, simulated new/corrected versions, delete confirmation, review status/thread/replies and admin-role notifications. Also Search and Browse. | Individual login; upload and edit; submissions require super-admin review. Only super admins may add/disable accounts. |
| Super admin | Admin capabilities plus Review page and Review screen, approve/reject, super-role notifications and automatic approval of their own uploads recorded in the thread. | Individual login, review authority and account management. Owner expects 1–2 super admins. |

These are UI modes, not authenticated identities. The prototype uses Riya/Dev sample actors and notifications addressed to a role; there are no individual accounts or per-user server inboxes. Trash, Activity history and Manage admins have no built view for any role. Exact access to permanently emptying Trash remains **UNKNOWN — check** when those permissions are planned.

## 1. Search

- **Primary use case:** Members find production assets by name/tag, project, episode, scene and type. Admins and super admins use the same discovery tools with review status visible.
- **Access:** Member, Admin, Super admin.
- **Actions:** Type comma-separated text/episode/scene terms; select/clear facets and type; reset an empty search; switch Grid/List; open detail; select/deselect assets and simulate ZIP download. Voice-over cards can play/pause generated sample audio.
- **Reads:** Role-projected asset list, names, project, type, scene uses, version number, review badge for admin roles, filter options, query/facets and selected IDs. Episode/scene/text matching is local (`parseSearch`, `assetMatches`).
- **Changes:** Search/view/selection state only; no asset data. ZIP preparation currently displays a toast and clears selection.
- **Backend mapping — PROPOSED:** `GET /api/assets` — filtered, paginated, role-safe results; `GET /api/projects` — permitted projects; `GET /api/facets` — role-safe episode/scene filter options; `POST /api/downloads` — request a selected-file archive; `GET /api/files/<id>` — permitted thumbnails/audio/originals. Query syntax, pagination and archive delivery are PROPOSED.
- **Database records:** Projects, Assets, Versions, Scene links; Admins/session for optional identity; review status/approval relationships are PROPOSED additions.
- **Server rules:** Anonymous result payloads and facet values must not leak hidden records, held-back/rejected versions, review notes or threads. Archive requests must re-check each requested file ID and version, not trust browser selection. A waiting new asset is visible; a waiting replacement version is held back. Read-only archive requests may be used by members but must not mutate library records.
- **Required states:** Empty/no matches is BUILT with reset; loading and fetch/download errors with retry are PROPOSED. Current toasts do not prove a download succeeded.
- **Current status / sources:** **BUILT — in-memory prototype**, `src/App.jsx`, `src/components/SearchView.jsx`, `Filters.jsx`, `AssetCard.jsx`, `AudioPlayer.jsx`, `src/lib/assets.js`, `src/lib/reviews.js`.
- **Requirements:** PERS-03, LIB-01, LIB-02, PREV-01, PREV-03, PREV-04, REV-02, REV-04, REV-08, UI-01.
- **Backend build phase:** 6 provides read/storage foundations; 7 connects the persistent library; 8 connects real files/previews; Review & Approval supplies role-safe visibility.

## 2. Browse

- **Primary use case:** Find assets through a project's episode/scene hierarchy instead of a text query.
- **Access:** Member, Admin, Super admin.
- **Actions:** Choose a project, episode, scene and type; open an asset; play sample voice-over audio on a card. Browse cards currently have selection disabled.
- **Reads:** Role-projected assets, derived projects, episode/scene uses, asset counts, type filters and current hierarchy selection.
- **Changes:** Browse project/episode/scene and shared type-filter state; no stored data.
- **Backend mapping — PROPOSED:** `GET /api/projects` — permitted projects; `GET /api/projects/:projectId/hierarchy` — episodes/scenes and permitted counts; `GET /api/assets` — project/episode/scene/type-filtered assets; `GET /api/files/<id>` — permitted preview/audio files.
- **Database records:** Projects, Assets, Versions, Scene links; PROPOSED review/approval fields.
- **Server rules:** Apply the same visibility policy to hierarchy nodes, counts and files as to Search. One asset may have several scene links; episode-wide scripts use an episode without a specific scene.
- **Required states:** No assets in the selected view is BUILT; empty project hierarchy, loading and hierarchy/list errors with retry are PROPOSED.
- **Current status / sources:** **BUILT — in-memory prototype**, `src/components/BrowseView.jsx`, `AssetCard.jsx`, `AudioPlayer.jsx`, `src/App.jsx`, `src/lib/assets.js`, `src/lib/reviews.js`.
- **Requirements:** PERS-01, PERS-03, LIB-01–LIB-03, PREV-01, PREV-03, REV-02, REV-04, REV-08, UI-01.
- **Backend build phase:** 6 foundations, 7 persistent hierarchy/library, 8 previews; Review & Approval controls visibility.

## 3. Asset detail

- **Primary use case:** Inspect one asset's metadata, scene uses and versions, then obtain the appropriate original. Admin roles also maintain the asset and participate in its review.
- **Access:** All roles for permitted assets; admin controls/thread only Admin and Super admin.
- **Actions:** Back to the prior view; choose an available version; simulate download; play/seek sample audio. Admin roles can rename, edit character search tags, add/remove scene links, simulate Add version, confirm/cancel deletion and use the review thread. Other metadata fields are displayed, not all editable here.
- **Reads:** Asset/type/project, characters/location/props, scene links, current/shown version, allowed version IDs, generation notes, derived sample properties and role. Admin roles also read review status/thread.
- **Changes:** `name` and `chars` for name/tag edits; `ep`, `sc`, `also` for links; latest `ver`, review round/entries and notifications for new versions; deletion removes the asset from browser memory. There is no recoverable Trash in this implementation. Most properties (size, resolution, uploader, etc.) are generated sample values in `assetSpecs`, not measured file metadata.
- **Backend mapping — PROPOSED:** `GET /api/assets/:assetId` — role-safe detail and permitted versions; `GET /api/assets/:assetId/versions` — allowed history; `PATCH /api/assets/:assetId` — name/metadata edits; `POST /api/assets/:assetId/scene-links` and `DELETE /api/assets/:assetId/scene-links/:linkId` — change uses; `POST /api/assets/:assetId/versions` — real new/corrected version upload; `DELETE /api/assets/:assetId` — move to Trash; `GET /api/files/<id>` — preview/open/download. Thread endpoints are in section 7.
- **Database records:** Assets, Projects, Versions, Scene links, Admins, Activity log; PROPOSED Review threads/entries and Notifications.
- **Server rules:** Re-check asset and individual version access on every read/file request. Never expose a rejected historical version just because its number is below the last approved version. Require logged-in admin roles for changes; validate links and retain at least one use. Metadata edits take effect immediately without review and enter Recent edits/activity history. Deletion needs confirmation plus server checks and must become recoverable Trash. File replacement starts a review round.
- **Required states:** Detail/media loading, missing/hidden/deleted asset and file/metadata failures with retry are PROPOSED; a dedicated missing-detail state is not built. Empty review history is BUILT within the thread. Link/name validation and delete confirmation/cancel are BUILT locally.
- **Current status / sources:** **BUILT — in-memory prototype**, `src/components/DetailView.jsx`, `Modals.jsx` (`AddVersionModal`), `AudioPlayer.jsx`, `src/App.jsx`, `src/lib/assets.js`, `src/lib/audio.js`, `src/lib/reviews.js`. Images/PDFs are placeholders, version selection is simulated, and download only emits a toast. Audio uses a generated tone unless `asset.audio` is supplied.
- **Requirements:** LIB-03, ACCT-03, AUDIT-01, TRASH-01, PREV-01–PREV-04, REV-01–REV-08, UI-01.
- **Backend build phase:** 6 data/file foundations; 6.1 authorized mutations/activity logging; 7 editing/version/Trash persistence; 8 media; Review & Approval adds review rules and thread integration.

## 4. Admin workspace / upload

- **Primary use case:** Admin roles submit a new asset with production metadata and open existing assets for maintenance.
- **Access:** Admin and Super admin through the prototype gate; members have no Upload navigation/view.
- **Actions:** Select/drop a local filename; choose or create a project name; choose asset type; enter name, scenes/episode, script version, characters, location, props, model and prompt; publish; open library items.
- **Reads:** Form state, project/type options, selected filename and all assets with review status. The seats/footer names are static sample text, not account data.
- **Changes:** Adds an asset and optional new project name to browser memory; resets the form/file selection; starts a review round. Admin uploads wait for review and notify the super role. Super uploads auto-approve with a recorded thread entry. A file is currently optional for metadata publication; no bytes are stored or transmitted.
- **Backend mapping — PROPOSED:** `GET /api/projects` and `GET /api/assets` — form options/admin library; `POST /api/projects` — create a project; `POST /api/assets` — upload binary plus metadata and initial scene links; `GET /api/storage/status` — free-space/upload-limit information. Multipart format, progress transport and transaction boundaries are PROPOSED.
- **Database records:** Projects, Assets, Versions, Scene links, Admins, Activity log; PROPOSED Review threads/entries and Notifications.
- **Server rules:** Authenticate/authorize every write. Validate actual bytes, supported type, size and metadata on the server; never trust the input's accept attribute or filename. Store under generated IDs inside managed storage; reject escapes, symlinks and overwrites. Enforce configured free-space reserve. Atomically record upload, reviewer status, author and notification. Never auto-approve an admin upload based on a client-supplied role/status.
- **Required states:** Form validation is BUILT locally. Empty library guidance, real upload progress/loading, cancellation/retry and upload/storage errors are PROPOSED.
- **Current status / sources:** **BUILT — in-memory prototype**, `src/components/AdminView.jsx`, `src/App.jsx` (`publishAsset`, `submitForReview`), `src/lib/reviews.js`. File picker/drop stores the filename only. Add-version selection is a separate simulation in `Modals.jsx`.
- **Requirements:** PERS-02, SAFE-01, STOR-01–STOR-03, UPLD-01–UPLD-03, LIB-01–LIB-03, ACCT-03, AUDIT-01, ROLE-01, REV-01, REV-02, REV-06, NOTIF-01, UI-01.
- **Backend build phase:** 6 managed storage/schema; 6.1 login/roles/logging; 7 real upload and library; Review & Approval submission rules; 8 file previews.

## 5. Review page

- **Primary use case:** Super admins triage submissions, revisit decisions and see routine asset edits that do not need approval.
- **Access:** Super admin only. Admins instead see status and threads on Asset detail.
- **Actions:** Switch Waiting / Not approved / Approved / Recent edits; inspect tab counts and submission rows; open a review screen or a recent-edit target.
- **Reads:** Assets, project/type, review status, last approved version, uploader, waiting duration, tab counts and recent edit entries. Waiting rows are sorted by the demo's waiting-minute value; dates/actors are sample values.
- **Changes:** Selected review tab and opened asset only.
- **Backend mapping — PROPOSED:** `GET /api/reviews?status=...` — queue/decision lists; `GET /api/reviews/counts` — tab/nav counts; `GET /api/activity?scope=recent-edits` — metadata/link changes. Status vocabulary, paging, sorting and Recent edits filtering are PROPOSED.
- **Database records:** Assets, Versions, Projects, Admins, Activity log; PROPOSED review status fields and Review threads/entries. Whether Recent edits is a view over Activity log or a separate projection is **UNKNOWN — check**.
- **Server rules:** Require an active authenticated super admin; admins must not gain access by guessing an endpoint. Exclude trashed/deleted items consistently from actionable queues. Derive counts, authors and times from authoritative records. Routine metadata edits appear immediately and must not enter the approval queue.
- **Required states:** Empty queue/tab and empty edits feed are BUILT. Loading and request error/try-again states are PROPOSED; there is currently no request lifecycle.
- **Current status / sources:** **BUILT — in-memory prototype**, `src/components/ReviewUI.jsx` (`ReviewQueue`), `src/components/Header.jsx`, `src/App.jsx`, `src/lib/reviews.js`.
- **Requirements:** ROLE-01, REV-01, REV-03, REV-04, REV-07, REV-08, REV-09, NOTIF-02, AUDIT-01, UI-01.
- **Backend build phase:** Review & Approval, depending on 6 schema/storage, 6.1 identity/activity, and 7 uploads.

## 6. Review screen

- **Primary use case:** A super admin examines one submission, compares it with the last approved version and records a decision with context from its thread.
- **Access:** Super admin only; in-app `view === 'review-item'`.
- **Actions:** Open a queue/notification target; compare last approved/current previews when a predecessor exists; read file properties and thread; approve; open Not approved dialog; enter required correction note; cancel/Escape or submit; reply; return to queue.
- **Reads:** Asset, latest submitted version, last approved version, status, round, submitter, sample properties and full thread. New assets show a single preview and a waiting-visibility explanation. Current previews are placeholders rather than submitted file bytes.
- **Changes:** Waiting status to Approved/Not approved; updates the last approved version on approval; appends a decision/note; adds an admin-role notification and toast. Whitespace-only rejection notes cannot be sent. A decided submission cannot be decided again through the helper.
- **Backend mapping — PROPOSED:** `GET /api/assets/:assetId/review` — authorized submission and comparison data; `POST /api/assets/:assetId/review-decisions` — decision plus required rejection note and explicit submitted-version identifier; `GET /api/files/<id>` — authorized comparison media. Reply mapping is in section 7.
- **Database records:** Assets, Versions, Admins, Activity log; PROPOSED Review threads/entries and Notifications.
- **Server rules:** Verify super-admin role, waiting status and the exact version/round being decided. Atomically persist decision, visibility/last-approved pointer, append-only entry, activity event and uploader notification. Reject stale/double decisions; never approve a newer upload accidentally. Required notes must be validated server-side. Client role checks are only a demo.
- **Required states:** Missing/deleted target produces a local toast before opening via `openReview`. Dedicated submission loading, inaccessible/missing screen, stale-decision conflict and server error/retry states are PROPOSED. Rejection note validation, disabled Send, focus trap, Escape/cancel and focus restoration are BUILT in `RejectDialog`.
- **Current status / sources:** **BUILT — in-memory prototype**, `src/components/ReviewUI.jsx` (`ReviewItem`, `RejectDialog`, `ReviewThread`), `src/App.jsx` (`openReview`, `reviewDecision`), `src/lib/reviews.js` (`decideReview`).
- **Requirements:** ROLE-01, REV-02–REV-05, REV-08, REV-09, AUDIT-01, NOTIF-01, UI-01.
- **Backend build phase:** Review & Approval; phase 8 provides real comparison media, 6.1 provides identities/activity logging.

## 7. Review thread

- **Primary use case:** Admin and super admin retain the conversation and evidence for successive review rounds on one asset.
- **Access:** Admin and Super admin, embedded on Asset detail and the super-admin Review screen; never Member.
- **Actions:** Read uploads/decisions/notes/replies oldest first; write/send a reply; admin can start a corrected upload when the latest submission is not approved. Existing entries have no edit/delete controls.
- **Reads:** Asset ID/name/current version and a review object containing status, approved version, round and entries. Each demo entry holds round, kind, actor, optional version, time, optional filename and text. Pending waiting text is derived for display, not a durable stored event.
- **Changes:** Appends replies; corrected version increments the review round and appends an upload; decisions append through the Review screen; super uploads append an explicit auto-approval event. Notifications go to the opposite demo role. Data is append-only through normal prototype actions but is not protected against browser modification.
- **Backend mapping — PROPOSED:** `GET /api/assets/:assetId/review-thread` — chronological rounds/entries; `POST /api/assets/:assetId/review-thread/replies` — append a reply; `POST /api/assets/:assetId/versions` — corrected upload/new round. No entry-update or entry-delete API is proposed.
- **Database records:** Assets, Versions, Admins; PROPOSED Review threads and Review entries, plus Notifications; Activity log records review decisions under REV-09. One thread per asset is an owner rule; SQL constraints/round identifiers are PROPOSED.
- **Server rules:** Authenticate admin roles and restrict all thread/note reads to them. Bind author/time to the session/server clock. Keep entries immutable and ordered by durable sequence; append corrected rounds to the existing thread. Validate nonblank/limited reply text. Preserve required historical records when assets are deleted; review-thread retention after permanent deletion is **UNKNOWN — check** (activity-log retention is already required).
- **Required states:** Empty thread and disabled blank reply are BUILT. Loading, failed reply with text retained/retry, missing thread and upload errors are PROPOSED.
- **Current status / sources:** **BUILT — in-memory prototype**, `src/components/ReviewUI.jsx` (`ReviewThread`), `src/App.jsx` (`replyToReview`, `submitForReview`, `uploadVersion`), `src/components/Modals.jsx`, `src/lib/reviews.js`. Add-version file selection remains simulated.
- **Requirements:** REV-01, REV-03–REV-06, REV-08, REV-09, NOTIF-01, AUDIT-01, AUDIT-03, UI-01.
- **Backend build phase:** Review & Approval, with version upload/storage in 7 and identity in 6.1.

## 8. Notification bell

- **Primary use case:** Admin roles learn about submissions, decisions, notes, replies and routine edits and open the affected asset/review screen.
- **Access:** Admin and Super admin; Member has no bell.
- **Actions:** Open/close dropdown; inspect unread count/list; open a notification and mark it read; Mark all as read; Escape/outside click closes the dropdown.
- **Reads:** Demo notification ID, target role (`to`), kind, message, time, unread flag and asset ID. Currently role-scoped in one browser, not per individual user and not delivered across browsers.
- **Changes:** Notification unread flags only when opening/marking all. Uploads/decisions/replies/edits generate notifications through App handlers; the reader cannot create arbitrary authoritative messages via the bell.
- **Backend mapping — PROPOSED:** `GET /api/notifications` — current user's list and unread count; `PATCH /api/notifications/:notificationId` — mark an owned notification read; `POST /api/notifications/read-all` — mark the current user's list read. Polling/SSE or another refresh strategy is **UNKNOWN — check**. No email service is proposed.
- **Database records:** Admins; PROPOSED Notifications with a user owner/read state, and links to Assets/Versions/review entries as needed. Physical schema and retention are PROPOSED.
- **Server rules:** Derive inbox owner from authenticated session; one user cannot read or mark another user's notifications. Server creates messages from trusted events. Do not leak private notes/messages to members. Re-check asset access when a notification is opened; handle deleted targets safely.
- **Required states:** Empty inbox is BUILT; loading, fetch/mark-read errors and retry are PROPOSED. Missing asset targets show a local toast.
- **Current status / sources:** **BUILT — in-memory prototype**, `src/components/ReviewUI.jsx` (`NotificationBell`), `src/components/Header.jsx`, `src/App.jsx` (`addNotification`, `onReadAll`, `onNotification`), `src/lib/reviews.js`.
- **Requirements:** NOTIF-01, REV-01, REV-03, REV-04, REV-05, REV-07, REV-08, ROLE-01, UI-01.
- **Backend build phase:** Review & Approval after 6.1 individual accounts; schema foundations in 6.

## 9. Login — planned

- **Primary use case:** Give each named admin/super admin a real session so authorship, permissions and notifications belong to a person. Members continue viewing without login.
- **Access:** Admin and Super admin sign in; no member account is required.
- **Actions:** PROPOSED individual sign-in, logout and handling expiry. First privileged account is created by a one-time local setup command, not public registration; its precise super-admin bootstrap flow is **UNKNOWN — check**.
- **Reads / changes:** PROPOSED account username/hash/role/active status and session identity/expiry; creates/ends sessions and appends login/account events. The browser must never receive password hashes.
- **Backend mapping — PROPOSED:** `POST /api/auth/login` — verify credentials/create session; `GET /api/auth/session` — current identity/role; `POST /api/auth/logout` — invalidate session. Cookie, CSRF, session-storage and rate-limit details require Phase 6.1 planning.
- **Database records:** Admins and Activity log from STRUCTURE; Sessions is an additional PROPOSED record/store.
- **Server rules:** Secure password hashing, active-account checks, server-checked roles on every privileged action, working logout and 8-hour inactivity expiry; disabling an account must revoke usable access. Login failure messages must not expose account details. Office-network HTTPS remains a later launch decision.
- **Required states:** Empty form; submitting; invalid/inactive credentials; expired session; server unavailable with retry. PROPOSED for real login. The existing temporary gate has a password input, wrong-password message and Cancel, but no real identity/session.
- **Current status / sources:** **PROPOSED — real login absent**. Prototype-only `AdminLoginModal` in `src/components/Modals.jsx`, `handleAdmin`/`unlockAdmin`/`returnToMember` in `src/App.jsx`, and role buttons in `Header.jsx` must be replaced.
- **Requirements:** ACCT-01–ACCT-05, ROLE-01, ROLE-02, AUDIT-01, UI-01.
- **Backend build phase:** 6.1; Phase 6 prepares Admins/schema. Re-check the SQLite boundary choice in 6.1 as previously approved.

## 10. Trash — planned

- **Primary use case:** Recover mistakenly deleted assets and their versions/scene links; permanently remove chosen items only after deliberate confirmation.
- **Access:** Planned privileged admin roles; anonymous members never see Trash. **UNKNOWN — check:** whether emptying Trash is allowed to both admin roles or super admins only.
- **Actions:** PROPOSED list deleted assets, restore, permanently delete one/all with typed confirmation; no automatic purge.
- **Reads / changes:** PROPOSED in-Trash flag, deletion time/actor, asset metadata, version file references and scene links. Restore returns the full asset; purge removes approved targets/files but retains immutable activity history.
- **Backend mapping — PROPOSED:** `GET /api/trash` — authorized list; `POST /api/trash/:assetId/restore` — restore one asset; `DELETE /api/trash/:assetId` — confirmed permanent removal; `DELETE /api/trash` — confirmed bulk purge. `DELETE /api/assets/:assetId` initiates soft deletion from Asset detail.
- **Database records:** Assets (Trash fields), Versions, Scene links, Projects, Admins, Activity log. STRUCTURE specifies a managed Trash folder; exact filesystem/DB recovery transactions are PROPOSED. Review data retention needs a separate decision.
- **Server rules:** Privileged sessions, authorized exact targets, typed confirmation and managed-path safety. Hide trashed assets/files from member responses. Log delete/restore/purge. Activity records use plain IDs/name snapshots without asset foreign keys so permanent deletion cannot erase them. Prevent unrelated file removal and inconsistent partially restored records.
- **Required states:** Empty Trash; loading/progress; restore/purge failure or conflict with recovery/retry; confirmation/cancel. All PROPOSED.
- **Current status / sources:** **PROPOSED — no Trash component/view in `src/`**. Existing `deleteAsset` in `src/App.jsx` and delete/cancel buttons in `DetailView.jsx` only remove browser-memory assets and are not soft deletion.
- **Requirements:** TRASH-01–TRASH-03, LIB-03, SAFE-01, ACCT-03, AUDIT-01, AUDIT-03, UI-01.
- **Backend build phase:** 7; Phase 6 prepares schema/storage and 6.1 authorization/logging.

## 11. Activity history — planned

- **Primary use case:** Admin roles inspect who changed an asset and when, including account actions and review decisions.
- **Access:** Admin and Super admin; member access is forbidden.
- **Actions:** PROPOSED view newest-first history and filter by asset. There are no edit/delete actions for history entries.
- **Reads / changes:** PROPOSED immutable records containing time, `admin_id`, action, `asset_id`, `asset_name`, details. This page is read-only; trusted server workflows append records. Recent edits is a narrower feed and is not the full activity history.
- **Backend mapping — PROPOSED:** `GET /api/activity` — paginated history, optionally filtered by asset. No public create/update/delete endpoint for audit records is proposed.
- **Database records:** Activity log; Admins for authenticated access/optional display lookup. Required plain values/snapshots must remain readable after an asset is permanently removed; no asset foreign key is allowed to delete/block those records.
- **Server rules:** Require admin-role session; append trusted actor/time/action data from every required operation, including review decisions. Prevent updates/deletes through the app and preserve history after asset purge. Protect credential/session secrets from log details.
- **Required states:** No events/no filter matches; loading; request error/retry; links to removed assets must show a missing-record explanation. All PROPOSED.
- **Current status / sources:** **PROPOSED — no Activity history component/view**. `recordEdit`/`reviewState.edits` in `src/App.jsx` and Recent edits in `ReviewUI.jsx` are a partial in-memory feed, not a durable audit log.
- **Requirements:** AUDIT-01–AUDIT-03, ACCT-03, REV-07, REV-09, UI-01.
- **Backend build phase:** 6.1; Phase 6 prepares schema; 7 logs file/Trash actions; Review & Approval extends logged events.

## 12. Manage admins — planned

- **Primary use case:** Super admins grant or disable named admin access without anonymous account registration.
- **Access:** Super admin only under ROLE-02, replacing the older ACCT-06 wording that allowed any admin to manage accounts. Admin/Member must be denied by the server.
- **Actions:** PROPOSED list necessary account information, add named admin, disable admin. **UNKNOWN — check:** who creates/promotes/demotes super admins and how the last active super admin is protected.
- **Reads / changes:** PROPOSED username, role (`admin` / `super admin`) and active flag; account creation writes a secure password hash; disabling changes active status and revokes sessions. Never expose hashes or credential values in listings/logs.
- **Backend mapping — PROPOSED:** `GET /api/admins` — permitted account list; `POST /api/admins` — create an admin; `PATCH /api/admins/:adminId` — disable an account. Role assignment, password setup/reset and reactivation contracts are **UNKNOWN — check**; these are not approved endpoints yet.
- **Database records:** Admins, Activity log; PROPOSED Sessions for revocation. Role is an owner-required schema addition to the older STRUCTURE account record.
- **Server rules:** Active authenticated super admin required on every account-management call; validate usernames and allowed role changes; use secure hashes and log actor/action without passwords. Account creation is not a member-facing feature.
- **Required states:** No additional admins; loading/submitting; duplicate/invalid username; inactive session/access denied; server failure/retry. All PROPOSED.
- **Current status / sources:** **PROPOSED — no Manage admins component/view**. `Header.jsx` role buttons, `App.jsx` booleans and `AdminView.jsx` static seat text do not create accounts.
- **Requirements:** ROLE-01, ROLE-02, ACCT-01, ACCT-02, ACCT-03, AUDIT-01; ACCT-06 is superseded by ROLE-02 pending formal R.1 reconciliation; UI-01.
- **Backend build phase:** 6.1, with account schema in 6. Exact super-admin lifecycle must be decided before implementation.

## Cross-page rules

1. **Desktop only:** target 1440px and 1280px without horizontal scrolling (UI-01). Existing small-screen CSS/tests remain in code, but no phone/tablet design is being promised. AGENTS' older phone-width wording awaits the approved R.0 update.
2. **Visibility is enforced on the server:** members never receive hidden assets, held-back/rejected versions, review notes or thread entries in any response, including files, search facets, downloads and error details. Waiting first uploads of new assets remain visible; replacement versions keep the last approved one visible. Rejection hides only the submitted version or the new asset if none was approved. Approval exposes the approved version. The prototype only filters UI data; all seeded data remains in browser memory.
3. **Authorization:** every library/review/account mutation requires an authenticated permitted admin role. Members may request an authorized download/archive without gaining write access. Only super admins decide reviews or add/disable accounts. Super-admin uploads auto-approve and record why; ordinary edits need no approval and appear immediately in Recent edits.
4. **Append-only history:** review entries/rounds and activity log cannot be edited/deleted through the app. Review decisions also enter the activity log. Actor/time come from the server, not the request body. The SQL protections, atomic notification writes, decision concurrency and review retention policy must be planned.
5. **Safe file access:** expose originals/previews only via opaque `/api/files/<id>` links, never disk paths. Validate file access for each asset/version. Generated IDs, storage containment, symlink rejection, no overwrites, configured size/free-space checks and recoverable Trash protect managed storage. Support byte-range requests for seekable real audio in Phase 8. Bind frontend and API to `127.0.0.1` until the planned network launch.
6. **Notifications:** in-app only, no email. Real inboxes are per user with read/unread state; prototype role inboxes must be replaced. Delivery/refresh strategy is PROPOSED.
7. **Page states:** wire empty, loading and actionable error/retry states alongside each backend integration. A synchronous prototype/toast is not evidence those network states or operations exist. File properties must come from real extraction/metadata when real media is connected.

## Prototype-only items that must not ship

| Item today | Required replacement/removal when the backend lands |
|---|---|
| Member/Admin/“Super” role switcher; `isAdmin`/`isSuper` browser authority | Phase 6.1 replaces authority with server sessions/roles and removes unrestricted role switching. Member mode becomes anonymous access/logout, not an account switch. Source: `Header.jsx`, `App.jsx`. |
| Client-side admin password gate | Phase 6.1 / ACCT-04 replaces it with individual authentication and removes the prototype password from every affected tracked file. Never copy its value into docs, new files, logs or production configuration. Source: `Modals.jsx`, `App.jsx`; historical cleanup list in PROGRESS. |
| Seeded/in-memory assets, IDs, fake version/file metadata and toast downloads | Phase 6 supplies persistence/API foundations; 7 replaces library mutations/uploads with durable operations; 8 replaces placeholder media, generated tones and download simulations with authorized file access. Remove demo fallbacks from production flows once each phase connects them. |
| In-memory review threads, fixed sample actors/times, role-addressed notifications and Recent edits | Review & Approval replaces them with server-controlled review state, immutable entries, real actors/timestamps, audit events and per-user notifications; remove seed/demo logic. |
| Simulated Add version filename picker | Phase 7 replaces `chooseVersionFile`/modal simulation with real file selection/upload/validation. The upload page's existing real picker only retains a filename and also needs byte transport/storage. |

## Known gaps and UNKNOWN items

- Review, asset, version and notification data resets on refresh. Theme preference alone is saved in localStorage. No backend, database, real login, durable audit log or real original-file delivery exists.
- Lint and Vitest remain unverified because local tooling stalled; the full lint scan also raced Playwright recreating `test-results`, and Vitest had worker-startup timeouts. Slow CSS processing is separately observed: production build succeeded in the owner's Terminal in about 2m11s, including a 102s `vite:css` transform. **UNKNOWN — check:** whether internet font loading causes those delays or tooling stalls; it is a suspicion, not a confirmed diagnosis. Do not call the checks green.
- The 21 distinct browser checks passed across runs at `71a6405`, with four new review tests passing twice and desktop screenshots reviewed. This does not replace incomplete lint/Vitest verification or release QA.
- R.0 baseline remains pending: `.gitignore` changes and three staged `dist/` removals from tracking must stay outside this C.1 commit. Complete R.0, then push as the owner's next step.
- Node is still `v24.15.0` (checked for C.1). The owner must update/pin the approved latest 24.x before Phase 6 is built. The older package engine range/dependencies still need the planned checks/pinning; this document changes neither.
- `.planning/` and its Phase 6 plan files are absent after the re-clone; Phase 6 needs re-planning. Older GSD/live-plan claims in the tracker are stale and await R.0. `reference/design-review-approval/` has not been saved in this checkout. `.thumbnail` and manual test images were previously reported lost in the re-clone.
- **UNKNOWN — check:** exact API contracts, physical SQL schema, pagination/query representation, session/cookie/CSRF design, notification transport/retention, review decision concurrency, review-thread retention after purge, super-admin bootstrap/promotion rules, final Trash permissions, frontend deep links, Review & Approval phase number/order, office host and secure network launch. Proposed routes in this document do not settle these choices.
- Formal BRIEF/STRUCTURE/requirement reconciliation for the three roles/review feature is still R.1 work. The current Arjun demo retains latest V4 while the external review handoff illustrated V3; members see approved V1 in either case. Existing older handoff notes about the Slack sidebar and GSD workflow are historical, not descriptions of the present prototype.
