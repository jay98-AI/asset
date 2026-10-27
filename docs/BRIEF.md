# Asset Hub Brief

## Core job

Asset Hub is an internal library for a creative production team to store, find, inspect, preview, download, and manage approved images, PDFs, and audio assets.

## Users and roles

- **Visitor:** anyone on the office network, with no login. Visitors can search, browse, view, preview, and download assets.
- **Admin:** one to three named people with individual logins. All admins are equal. They can upload, edit, manage versions and scene links, delete and restore assets, empty Trash, read activity history, and add or disable admins.

## MVP features

- Persistent project, asset, version, and scene-link data in SQLite.
- Managed local file storage by project, asset, and version.
- Image, PDF, and audio upload, preview, open, and download workflows.
- Individual admin accounts, server-checked access for changes, logout, and inactive-session expiry.
- Recoverable Trash and an immutable admin activity log.

## Later features

- A shareable link per asset.
- Video-file support.
- Office-network launch after the local workflow is reliable.

## Data and access

Visitors read active assets and their versions and scene links. Admins make all changes. Trash is admin-only. Passwords are stored only as secure hashes. The activity log records who did what, to which asset, and when; admins can read it, but nobody can edit or delete it.

## Scale

The expected library is 1,000–10,000 files. The largest individual file is under 50 MB.

## Hosting plan

Build and test on this PC bound to `127.0.0.1`. The office host computer and network launch are deliberately not decided yet.

## Open Stage 10 items

- Choose the host machine.
- Open access to the office network.
- Research an HTTPS approach for secure admin logins over the network.
- Ensure guest Wi-Fi cannot reach the app.
- Set up database and file backups.
- Document how to move the app to another computer.
