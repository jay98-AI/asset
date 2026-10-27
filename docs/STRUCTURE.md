APPROVED — 2026-10-26

# Asset Hub Structure

## Current application

Asset Hub is currently a single-page React application at `/`. It does not use URL routes; views change inside the app.

| Current view | URL / state | What it does today |
|---|---|---|
| Search | `/` | Searches and filters the in-memory asset list by text, project, episode, scene, and type. Visitors can open and select assets. |
| Browse | `/` | Browses the in-memory list by project, episode, scene, and type. |
| Asset detail | `/` in-app state | Shows metadata, scene use, a version count, a generic image/PDF placeholder, and the prototype download action. Voice-over uses an in-browser audio player. |
| Prototype admin gate | `/` modal | A temporary browser-side gate; it is not real authentication. |
| Admin workspace | `/` in-app state | Publishes metadata, creates project names, simulates versions, changes scene links, and deletes in browser memory only. |

### Current flows

1. A visitor searches or browses, opens an asset, inspects it, and starts the current prototype download action.
2. A prototype admin passes the temporary gate, enters metadata, and publishes it to browser memory.
3. A prototype admin can simulate a version, add or remove scene links, and confirm an in-memory deletion.

The current prototype has no server, database, real upload, real file download, persistent asset history, authorization, or audit trail. Refreshing loses changes.

## Planned views

| Planned view | Purpose | Access |
|---|---|---|
| Admin login | Individual named-admin sign-in and logout | Admins |
| Admin workspace | Real upload, edit, version, scene-link, and deletion actions | Admins |
| Trash | View, restore, and permanently empty deleted assets | Admins |
| Activity history | Read immutable history, newest first, with asset filtering | Admins |
| Manage admins | Add or disable named admins | Admins |

## Roles

| Role | Login | Can read | Can change |
|---|---|---|---|
| Visitor | No login; anyone on the office network | Search, browse, view, preview, and download active assets | Nothing |
| Admin | Individual login; one to three named people | Everything, including Trash and activity history | Upload, edit, versions, scene links, delete, Trash, activity history access, and add/disable admins. All admins are equal. |

Every change action must be checked on the server. Hiding an interface button is not enough.

## Planned data and access

| Record | What it holds | Who can read | Who can change |
|---|---|---|---|
| Projects | Stable project ID and project name | All | Admins |
| Assets | Stable ID, project, name, type, metadata, current version, safe managed-file reference, `created_by`, `updated_by`, in-Trash flag, `deleted_at`, and `deleted_by` | All, except Trash items are admins only | Admins |
| Versions | Version number, file metadata, stored-file reference, and `uploaded_by` | All | Admins |
| Scene links | Asset-to-episode and asset-to-scene relationships | All | Admins |
| Admins | Username, password hash only, and active flag | Server only | Admins can add or disable admins |
| Activity log | Time, admin, action, asset, and details | Admins | Nobody; records cannot be edited or deleted through the app |

## Managed storage

SQLite will store metadata and relationships. Managed local folders will store original binaries organized by project, asset, and version. A Trash folder lives inside managed storage. Deleting moves an asset and all of its version files to Trash; restoring returns the asset with its versions and scene links. Emptying Trash is permanent, admin-only, requires typed confirmation, and never runs automatically.

## Scope and hosting

This release supports images, PDFs, and audio. It is designed for 1,000–10,000 files, with individual files under 50 MB. Build and test remain on this PC at `127.0.0.1`; the office host computer and network launch are later decisions. Shareable asset links and video files are later features.
