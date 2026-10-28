import { NotificationBell } from './ReviewUI.jsx'

function ThemeIcon({ theme }) {
  return theme === 'dark' ? (
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 10.3A5.7 5.7 0 0 1 5.7 3 5.5 5.5 0 1 0 13 10.3Z" /></svg>
  ) : (
    <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" /><path d="M8 1.5v1.4M8 13.1v1.4M14.5 8h-1.4M2.9 8H1.5M12.6 3.4l-1 1M4.4 11.6l-1 1M12.6 12.6l-1-1M4.4 4.4l-1-1" /></svg>
  )
}

export default function Header({ view, isAdmin, role, waitingCount, notifications, onReadAll, onNotification, theme, onThemeToggle, onNavigate, onMember, onAdmin, onSuper }) {
  return (
    <header className="app-header">
      <button className="brand" onClick={() => onNavigate('search')} aria-label="Asset Hub home">
        <span className="brand-mark" aria-hidden="true" />
        <span>Asset Hub</span>
      </button>
      <nav aria-label="Primary navigation">
        <button className={view === 'search' ? 'is-active' : ''} onClick={() => onNavigate('search')}>Search</button>
        <button className={view === 'browse' ? 'is-active' : ''} onClick={() => onNavigate('browse')}>Browse</button>
        {isAdmin && <button className={view === 'admin' ? 'is-active' : ''} onClick={() => onNavigate('admin')}>Upload</button>}
        {role === 'super' && <button className={view.startsWith('review') ? 'is-active review-nav' : 'review-nav'} onClick={() => onNavigate('review')}>Review{waitingCount > 0 && <span className="review-nav-count">{waitingCount}</span>}</button>}
      </nav>
      <div className="header-actions">
        {isAdmin && <NotificationBell key={role} notifications={notifications} onReadAll={onReadAll} onOpen={onNotification} />}
        <button className="theme-toggle" onClick={onThemeToggle} aria-pressed={theme === 'dark'} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          <ThemeIcon theme={theme} />
        </button>
        <div className="role-switch" aria-label="Choose role">
          <button className={!isAdmin ? 'is-active' : ''} onClick={onMember}>Member</button>
          <button className={role === 'admin' ? 'is-active' : ''} aria-pressed={role === 'admin'} onClick={onAdmin}>Admin</button>
          <button className={role === 'super' ? 'is-active' : ''} aria-pressed={role === 'super'} onClick={onSuper}>Super</button>
        </div>
      </div>
    </header>
  )
}
