export const REVIEW_STATUS = {
  waiting: { label: 'Waiting for review', icon: '◷' },
  approved: { label: 'Approved', icon: '✓' },
  rejected: { label: 'Not approved', icon: '×' },
}

export function reviewFor(asset, reviews) {
  return reviews[asset.id] ?? { status: 'approved', approved: asset.ver, round: 0, entries: [] }
}

// These projections demonstrate visibility only. Real authorization belongs in the API.
export function memberAsset(asset, reviews) {
  const review = reviewFor(asset, reviews)
  if (!review.approved && review.status === 'rejected') return null
  const approvedVersions = reviews[asset.id] ? [review.approved, ...review.entries.filter((entry) => entry.kind === 'approve').map((entry) => entry.version)].filter(Boolean) : Array.from({ length: asset.ver }, (_, index) => index + 1)
  return { ...asset, ver: review.approved || asset.ver, availableVersions: approvedVersions.length ? [...new Set(approvedVersions)].sort((a, b) => a - b) : [asset.ver] }
}

export function startReview(asset, previous, role, fileName = '') {
  const who = role === 'super' ? 'Dev' : 'Riya'
  const round = (previous?.round ?? 0) + 1
  const entry = { round, kind: 'upload', who, version: asset.ver, time: 'Just now', fileName }
  return {
    status: role === 'super' ? 'approved' : 'waiting',
    approved: role === 'super' ? asset.ver : previous?.approved ?? 0,
    round,
    since: 'Just now',
    uploader: who,
    entries: [...(previous?.entries ?? []), entry,
      ...(role === 'super' ? [{ round, kind: 'approve', who, version: asset.ver, time: 'Just now', text: 'Automatically approved: uploaded by a super admin.' }] : [])],
  }
}

export function decideReview(review, asset, status, note = '') {
  if (review.status !== 'waiting') return review
  if (status === 'rejected' && !note.trim()) return review
  return {
    ...review, status,
    approved: status === 'approved' ? asset.ver : review.approved,
    entries: [...review.entries, { round: review.round, kind: status === 'approved' ? 'approve' : 'reject', who: 'Dev', version: asset.ver, time: 'Just now', text: note.trim() }],
  }
}

export function createReviewDemo() {
  const upload = (round, version, time) => ({ round, version, kind: 'upload', who: 'Riya', time })
  const approve = (round, version, time) => ({ round, version, kind: 'approve', who: 'Dev', time })
  return {
    reviews: {
      1: { status: 'waiting', approved: 1, round: 3, since: '2 min', waitingMinutes: 2, uploader: 'Riya', entries: [
        upload(1, 1, 'Oct 12 · 10:14'), approve(1, 1, 'Oct 12 · 15:02'),
        upload(2, 2, 'Oct 22 · 11:40'),
        { round: 2, version: 2, kind: 'reject', who: 'Dev', time: 'Oct 22 · 16:25', text: 'The jacket colour has drifted from the approved palette. It reads olive here, but the series bible specifies teal-grey. Please also check: (1) the left sleeve is missing the rope detail, (2) the lantern in the back view is held in the wrong hand, (3) the three turnaround views don’t match in height, and (4) export at 4096 × 4096 like version 1. The face and hair are good, no changes there.' },
        { round: 2, kind: 'reply', who: 'Riya', time: 'Oct 23 · 09:10', text: 'Understood. I’ll regenerate the turnaround with the teal-grey palette and re-export at 4096 × 4096.' },
        upload(3, 4, 'Today · 09:58'),
      ] },
      3: { status: 'rejected', approved: 1, round: 2, uploader: 'Riya', entries: [upload(1, 1, 'Oct 14 · 13:20'), approve(1, 1, 'Oct 14 · 17:45'), upload(2, 2, 'Oct 27 · 14:20'), { round: 2, version: 2, kind: 'reject', who: 'Dev', time: 'Today · 09:35', text: 'The tide line is too high against the pier posts. Match the level in the Ep1 Sc3 keyframe. Everything else matches.' }] },
      4: { status: 'waiting', approved: 0, round: 1, since: '3 hr', waitingMinutes: 180, uploader: 'Riya', entries: [upload(1, 1, 'Today · 07:10')] },
      7: { status: 'waiting', approved: 0, round: 1, since: '1 hr', waitingMinutes: 60, uploader: 'Riya', entries: [upload(1, 1, 'Today · 09:02')] },
    },
    notifications: [
      { id: 's1', to: 'super', kind: 'upload', text: 'Riya uploaded version 4 of Arjun – Character Sheet', time: '2 min ago', unread: true, assetId: 1 },
      { id: 's2', to: 'super', kind: 'upload', text: 'Riya uploaded Arjun VO – Sc03', time: '1 hr ago', unread: true, assetId: 7 },
      { id: 's3', to: 'super', kind: 'upload', text: 'Riya uploaded Arjun on the Pier', time: '3 hr ago', unread: true, assetId: 4 },
      { id: 's4', to: 'super', kind: 'edit', text: 'Riya edited tags on Harbor at Dusk', time: 'Yesterday', unread: false, assetId: 3 },
      { id: 'a1', to: 'admin', kind: 'reject', text: 'Dev marked Harbor at Dusk version 2 not approved. Open it to read the note.', time: '40 min ago', unread: true, assetId: 3 },
      { id: 'a2', to: 'admin', kind: 'approve', text: 'Dev approved Meera at the Window', time: '2 hr ago', unread: true, assetId: 9 },
      { id: 'a3', to: 'admin', kind: 'approve', text: 'Dev approved Arjun – Character Sheet version 1', time: 'Oct 12', unread: false, assetId: 1 },
    ],
    edits: [
      { id: 'e1', text: 'Riya edited tags on Harbor at Dusk', time: '2 days ago', assetId: 3 },
      { id: 'e2', text: 'Riya linked Meera – Character Sheet to Ep 2 · Sc 1', time: 'Yesterday', assetId: 2 },
      { id: 'e3', text: 'Riya edited tags on Old Map', time: 'Yesterday', assetId: 12 },
    ],
  }
}
