export function FilterDropdown({ label, values, options, open, onToggle, onChange, onClear }) {
  const active = values.length > 0

  return (
    <div className="filter-dropdown">
      <button
        className={`filter-trigger ${active ? 'is-active' : ''}`}
        onClick={onToggle}
        aria-expanded={open}
      >
        {active ? `${label} · ${values.length}` : label}
        <span className="dropdown-chevron" aria-hidden="true">
          <svg viewBox="0 0 16 16" focusable="false">
            <path d="m4 6 4 4 4-4" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="filter-menu">
          {options.map((option) => (
            <button key={option.value} onClick={() => onChange(option.value)}>
              <span className="checkmark" aria-hidden="true">
                {values.includes(option.value) && (
                  <svg viewBox="0 0 16 16" focusable="false"><path d="m3.5 8 3 3 6-6" /></svg>
                )}
              </span>
              {option.label}
            </button>
          ))}
          <button className="filter-clear" onClick={onClear}>Clear</button>
        </div>
      )}
    </div>
  )
}

export function TypeFilters({ types, current, onChange }) {
  return (
    <div className="type-filters" aria-label="Asset type">
      {['All', ...types].map((type) => (
        <button
          key={type}
          className={current === type ? 'is-active' : ''}
          onClick={() => onChange(type)}
        >
          {type}
        </button>
      ))}
    </div>
  )
}
