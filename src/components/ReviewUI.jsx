import { useEffect, useRef, useState } from 'react'
import { TYPE_HUES } from '../data/assets.js'
import { assetSpecs } from '../lib/assets.js'
import { REVIEW_STATUS, reviewFor } from '../lib/reviews.js'

export function StatusBadge({ status }) {
  const value = REVIEW_STATUS[status]
  return <span className={`review-badge ${status}`}><span aria-hidden="true">{value.icon}</span>{value.label}</span>
}

export function ReviewThread({ asset, review, role, onReply, onCorrect }) {
  const [reply, setReply] = useState('')
  const rounds = [...new Set(review.entries.map((entry) => entry.round))]
  const verbs = { upload: 'uploaded version', approve: 'approved version', reject: 'marked version', reply: 'replied' }
  return <section className="review-thread" aria-label={`Review thread for ${asset.name}`}>
    <header><div><h2>Review thread</h2><small>Admins only</small></div><StatusBadge status={review.status} /></header>
    {review.status === 'rejected' && role === 'admin' && <button className="primary-button correction-button" onClick={onCorrect}>↑ Upload corrected version</button>}
    {!rounds.length && <p className="thread-empty">No review activity yet. Upload a new version to start a round.</p>}
    {rounds.map((round) => <section className="thread-round" key={round} aria-label={`Round ${round}`}>
      <div className="round-label">Round {round}</div>
      <ol>{review.entries.filter((entry) => entry.round === round).map((entry, index) => <li className={`thread-entry ${entry.kind}`} key={`${round}-${index}`}>
        <span className="event-dot" aria-hidden="true">{{ upload: '↑', approve: '✓', reject: '×', reply: '↩' }[entry.kind]}</span>
        <div><p><strong>{entry.who}</strong> {verbs[entry.kind]} {entry.version}{entry.kind === 'reject' && <strong className="rejection-text"> not approved</strong>}</p><time>{entry.time}</time>
          {entry.fileName && <small className="thread-file">{entry.fileName}</small>}
          {entry.text && <div className={`thread-note ${entry.kind === 'reply' ? 'reply-note' : ''}`}>{entry.kind === 'reject' && <small>Note to uploader</small>}<p>{entry.text}</p></div>}
        </div>
      </li>)}
      {review.status === 'waiting' && round === review.round && <li className="thread-entry pending"><span className="event-dot" aria-hidden="true">◷</span><p>Waiting for Dev to review version {asset.ver}</p></li>}
      </ol>
    </section>)}
    <form className="thread-reply" onSubmit={(event) => { event.preventDefault(); if (reply.trim()) { onReply(reply.trim()); setReply('') } }}>
      <label htmlFor="review-reply">Reply to thread</label><textarea id="review-reply" placeholder="Write a reply…" value={reply} onChange={(event) => setReply(event.target.value)} maxLength={5000} />
      <button className="primary-button" disabled={!reply.trim()}>Send reply</button>
    </form>
  </section>
}

export function NotificationBell({ notifications, onReadAll, onOpen }) {
  const [open, setOpen] = useState(false)
  const container = useRef(null)
  const unread = notifications.filter((item) => item.unread).length
  useEffect(() => {
    if (!open) return
    const close = (event) => { if (!container.current?.contains(event.target)) setOpen(false) }
    const escape = (event) => { if (event.key === 'Escape') { setOpen(false); container.current?.querySelector('button')?.focus() } }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape) }
  }, [open])
  return <div className="notification-container" ref={container}>
    <button className={`notification-bell ${open ? 'is-open' : ''}`} aria-label={`Notifications, ${unread} unread`} aria-expanded={open} aria-controls="notifications-panel" onClick={() => setOpen(!open)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>{unread > 0 && <span className="notification-count">{unread}</span>}
    </button>
    {open && <section className="notification-popover" id="notifications-panel" aria-label="Notifications">
      <header><h2>Notifications</h2><button onClick={onReadAll}>Mark all as read</button></header>
      {!notifications.length && <p className="notification-empty">You’re all caught up. New notifications will appear here.</p>}
      {notifications.map((item) => <button className={`notification-item ${item.unread ? 'unread' : ''}`} key={item.id} onClick={() => { onOpen(item); setOpen(false) }}>
        <span className={`notification-symbol ${item.kind}`} aria-hidden="true">{{ upload: '↑', approve: '✓', reject: '×', edit: '✎', reply: '↩' }[item.kind]}</span>
        <span>{item.text}<time>{item.time}</time></span>{item.unread && <span className="unread-dot" aria-label="Unread" />}
      </button>)}
    </section>}
  </div>
}

export function ReviewQueue({ assets, reviews, edits, tab, onTab, onOpen }) {
  const tabs = { Waiting: 'waiting', 'Not approved': 'rejected', Approved: 'approved', 'Recent edits': 'edits' }
  const rows = assets.filter((asset) => reviewFor(asset, reviews).status === tabs[tab]).sort((a, b) => (reviewFor(b, reviews).waitingMinutes ?? 0) - (reviewFor(a, reviews).waitingMinutes ?? 0))
  return <main className="page-shell review-page">
    <div className="eyebrow">Review</div><h1>{tab === 'Waiting' ? 'Waiting for review' : tab}</h1>
    <p className="review-subtitle">{tab === 'Recent edits' ? `${edits.length} edits` : `${rows.length} items`}</p>
    <nav className="review-tabs" aria-label="Review categories">{Object.entries(tabs).map(([label, status]) => <button key={label} className={label === tab ? 'is-active' : ''} aria-current={label === tab ? 'page' : undefined} onClick={() => onTab(label)}>{label}<span>{status === 'edits' ? edits.length : assets.filter((asset) => reviewFor(asset, reviews).status === status).length}</span></button>)}</nav>
    {tab === 'Recent edits' ? <div className="recent-edits">{edits.map((edit) => <button key={edit.id} onClick={() => onOpen(edit.assetId)}><span aria-hidden="true">✎</span><span>{edit.text}</span><time>{edit.time}</time></button>)}</div> : rows.length ? <table className="review-table"><thead><tr><th>Asset</th><th>Type</th><th>Submitted</th><th>By</th><th>Waiting</th><th>Status</th></tr></thead><tbody>{rows.map((asset) => { const review = reviewFor(asset, reviews); return <tr key={asset.id}>
      <td><button className="review-asset-link" onClick={() => onOpen(asset.id)}><span className="review-thumb" style={{ '--asset-hue': TYPE_HUES[asset.type] }} /><span><strong>{asset.name}</strong><small>{asset.project}</small></span></button></td><td>{asset.type}</td><td>{review.approved === 0 ? 'New asset' : `Version ${asset.ver}`}</td><td>{review.uploader ?? 'Dev'}</td><td>{review.status === 'waiting' ? review.since : '—'}</td><td><StatusBadge status={review.status} /></td>
    </tr> })}</tbody></table> : <div className="review-empty"><span aria-hidden="true">✓</span><h2>{tab === 'Waiting' ? 'Nothing waiting for review' : `No ${tab.toLowerCase()} items`}</h2><p>{tab === 'Waiting' ? 'You’re all caught up. New uploads will appear here.' : 'Items will appear here after a review decision.'}</p></div>}
    {tab === 'Recent edits' && !edits.length && <div className="review-empty"><h2>No recent edits</h2><p>Metadata and scene-link changes will appear here.</p></div>}
  </main>
}

export function ReviewItem({ asset, review, onBack, onApprove, onReject, onReply }) {
  const compare = review.approved > 0 && asset.ver > review.approved
  return <main className="page-shell review-item">
    <button className="back-button" onClick={onBack}>← Review</button>
    <div className="review-item-heading"><div><p className="review-byline">{review.approved ? `Version ${asset.ver}` : 'New asset'} · Round {review.round || 1} · {review.uploader ?? 'Dev'} <StatusBadge status={review.status} /></p><h1>{asset.name}</h1></div>
      {review.status === 'waiting' && <div className="review-decisions"><button className="reject-button" onClick={onReject}>× Not approved</button><button className="approve-button" onClick={onApprove}>✓ Approve</button></div>}
    </div>
    <div className="review-item-layout"><section className="comparison-details"><div className={`review-comparison ${compare ? '' : 'single'}`}>
      {compare && <ReviewPreview asset={asset} version={review.approved} label="✓ Last approved" />}
      <ReviewPreview asset={asset} version={asset.ver} label={compare ? '↑ New version' : asset.type} />
    </div><div className="property-grid">{assetSpecs(asset).map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      {!review.approved && review.status === 'waiting' && <p className="review-visibility-note">New asset: members can see and download this while it waits for review.</p>}
    </section><ReviewThread key={asset.id} asset={asset} review={review} role="super" onReply={onReply} /></div>
  </main>
}

function ReviewPreview({ asset, version, label }) {
  return <div><div className="comparison-label">{label} · V{version}</div><div className="review-preview" style={{ '--asset-hue': TYPE_HUES[asset.type] }}>{asset.name.replace(/\s+/g, '_')}_v{version}</div></div>
}

export function RejectDialog({ asset, onClose, onSubmit }) {
  const [note, setNote] = useState('')
  const dialog = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    dialog.current.querySelector('textarea').focus()
    const keydown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key === 'Tab') {
        const controls = [...dialog.current.querySelectorAll('textarea,button:not(:disabled)')]
        const first = controls[0], last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.removeEventListener('keydown', keydown); previous?.focus() }
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <form className="modal reject-modal" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="reject-title" onSubmit={(event) => { event.preventDefault(); if (note.trim()) onSubmit(note.trim()) }}>
      <h2 id="reject-title">Not approved</h2><p>{asset.name} · Version {asset.ver}</p>
      <label htmlFor="rejection-note">What needs to be corrected? <span>Required</span></label><textarea id="rejection-note" required maxLength={5000} placeholder="Describe what the uploader should fix…" value={note} onChange={(event) => setNote(event.target.value)} />
      <p className="rejection-help">The uploader is notified with this note. Members keep seeing the last approved version when available; otherwise the asset is hidden. Send fixes or praise here.</p>
      <div className="modal-actions"><span className="escape-hint">Esc to cancel</span><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={!note.trim()}>Send note</button></div>
    </form>
  </div>
}
