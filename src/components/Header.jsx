function ThemeIcon({ theme }) {
  return theme === 'dark' ? (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M13 10.3A5.7 5.7 0 0 1 5.7 3 5.5 5.5 0 1 0 13 10.3Z" /></svg>
  ) : (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="3" /><path d="M8 1.5v1.4M8 13.1v1.4M14.5 8h-1.4M2.9 8H1.5M12.6 3.4l-1 1M4.4 11.6l-1 1M12.6 12.6l-1-1M4.4 4.4l-1-1" /></svg>
  )
}

function ChevronIcon({ collapsed }) {
  return <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d={collapsed ? 'M6 3.5 10.5 8 6 12.5' : 'm10 3.5L5.5 8l4.5 4.5'} /></svg>
}

function NavIcon({ name }) {
  const paths = {
    search: <><circle cx="7" cy="7" r="3.5" /><path d="m10 10 3 3" /></>,
    browse: <><path d="M2.5 3.5h4v4h-4zM9.5 3.5h4v4h-4zM2.5 9.5h4v4h-4zM9.5 9.5h4v4h-4z" /></>,
    upload: <><path d="M8 11.5v-8M5 6.5l3-3 3 3M3 11.5v1.5h10v-1.5" /></>,
  }
  return <svg className="nav-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">{paths[name]}</svg>
}

export default function Header({ view, isAdmin, theme, sidebarCollapsed, onThemeToggle, onSidebarToggle, onNavigate, onMember, onAdmin }) {
  return (
    <header className="app-header">
      <div className="sidebar-top">
        <button className="brand" onClick={() => onNavigate('search')} aria-label="Asset Hub home">
          <span className="brand-name">Asset <span>Hub</span></span>
        </button>
        <button className="sidebar-toggle" onClick={onSidebarToggle} aria-expanded={!sidebarCollapsed} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <ChevronIcon collapsed={sidebarCollapsed} />
        </button>
      </div>
      <nav aria-label="Primary navigation">
        <span className="nav-group-label">Library</span>
        <button className={view === 'search' ? 'is-active' : ''} onClick={() => onNavigate('search')} title="Search"><NavIcon name="search" /><span className="nav-label">Search</span></button>
        <button className={view === 'browse' ? 'is-active' : ''} onClick={() => onNavigate('browse')} title="Browse"><NavIcon name="browse" /><span className="nav-label">Browse</span></button>
        {isAdmin && <button className={view === 'admin' ? 'is-active' : ''} onClick={() => onNavigate('admin')} title="Upload"><NavIcon name="upload" /><span className="nav-label">Upload</span></button>}
      </nav>
      <div className="header-footer">
        <button className="theme-toggle" onClick={onThemeToggle} aria-pressed={theme === 'dark'} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          <ThemeIcon theme={theme} />
          <span>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>
        </button>
        <div className="role-switch" aria-label="Choose role">
          <button className={!isAdmin ? 'is-active' : ''} onClick={onMember} title="Member"><span className="role-label">Member</span><span className="role-short" aria-hidden="true">M</span></button>
          <button className={isAdmin ? 'is-active' : ''} onClick={onAdmin} title="Admin"><span className="role-label">Admin</span><span className="role-short" aria-hidden="true">A</span></button>
        </div>
      </div>
    </header>
  )
}
