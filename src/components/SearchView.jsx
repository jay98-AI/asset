import AssetCard from './AssetCard.jsx'
import { FilterDropdown, TypeFilters } from './Filters.jsx'
import { sceneLabel } from '../lib/assets.js'

export default function SearchView({
  query,
  onQuery,
  chips,
  assets,
  selected,
  onSelect,
  onOpen,
  filters,
  filterOptions,
  openFilter,
  onOpenFilter,
  onToggleFilter,
  onClearFilter,
  onClearAll,
  onResetSearch,
  types,
  type,
  onType,
  onClearSelection,
  onDownloadSelection,
  viewMode,
  onViewMode,
}) {
  const hasFilters = Object.values(filters).some((values) => values.length) || type !== 'All'

  return (
    <main className="page-shell search-view">
      <section className="search-hero">
        <div className="eyebrow">Search assets</div>
        <h1 className="sr-only">Find the right asset, fast.</h1>
        <label className="search-box">
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Try: Arjun, ep01, sc03"
            aria-label="Search assets"
            autoFocus
          />
          {query && <button onClick={() => onQuery('')} aria-label="Clear search">×</button>}
        </label>
        <div className="search-interpretation">
          {chips.map((chip) => <span className="search-chip" key={chip}>{chip}</span>)}
          <small>{chips.length ? 'How your search was read' : 'Separate terms with commas: name, ep01, sc03'}</small>
        </div>
      </section>

      <section className="result-tools">
        <div className="filter-row">
          <FilterDropdown
            label="Project"
            values={filters.projects}
            options={filterOptions.projects}
            open={openFilter === 'projects'}
            onToggle={() => onOpenFilter('projects')}
            onChange={(value) => onToggleFilter('projects', value)}
            onClear={() => onClearFilter('projects')}
          />
          <FilterDropdown
            label="Episode"
            values={filters.episodes}
            options={filterOptions.episodes}
            open={openFilter === 'episodes'}
            onToggle={() => onOpenFilter('episodes')}
            onChange={(value) => onToggleFilter('episodes', value)}
            onClear={() => onClearFilter('episodes')}
          />
          <FilterDropdown
            label="Scene"
            values={filters.scenes}
            options={filterOptions.scenes}
            open={openFilter === 'scenes'}
            onToggle={() => onOpenFilter('scenes')}
            onChange={(value) => onToggleFilter('scenes', value)}
            onClear={() => onClearFilter('scenes')}
          />
          {hasFilters && <button className="text-button" onClick={onClearAll}>Clear all</button>}
          <div className="view-toggle" aria-label="Asset layout">
            <button className={viewMode === 'grid' ? 'is-active' : ''} onClick={() => onViewMode('grid')} aria-pressed={viewMode === 'grid'}>Grid</button>
            <button className={viewMode === 'list' ? 'is-active' : ''} onClick={() => onViewMode('list')} aria-pressed={viewMode === 'list'}>List</button>
          </div>
        </div>
        <TypeFilters types={types} current={type} onChange={onType} />
      </section>

      <div className="result-heading">
        <div>
          <strong>{assets.length} {assets.length === 1 ? 'asset' : 'assets'}</strong>
        </div>
      </div>

      {assets.length ? (
        viewMode === 'grid' ? (
          <section className="asset-grid" aria-live="polite">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                selected={selected.includes(asset.id)}
                onSelect={onSelect}
                onOpen={onOpen}
              />
            ))}
          </section>
        ) : (
          <section className="asset-list" aria-live="polite">
            {assets.map((asset) => (
              <article className="asset-list-row" key={asset.id}>
                <button className="select-button" onClick={() => onSelect(asset.id)} aria-pressed={selected.includes(asset.id)} aria-label={`${selected.includes(asset.id) ? 'Unselect' : 'Select'} ${asset.name}`}>
                  {selected.includes(asset.id) ? '✓' : ''}
                </button>
                <button className="asset-list-name" onClick={() => onOpen(asset.id)}>{asset.name}</button>
                <span>{asset.type}</span>
                <span>{sceneLabel(asset)}</span>
                <span className="num">V{asset.ver}</span>
              </article>
            ))}
          </section>
        )
      ) : (
        <div className="empty-state">
          <div>⌕</div>
          <h2>No matching assets</h2>
          <p>Try a broader search or clear one of your filters.</p>
          <button className="primary-button" onClick={onResetSearch}>Reset search</button>
        </div>
      )}

      {selected.length > 0 && (
        <aside className="selection-tray">
          <div><strong>{selected.length}</strong> {selected.length === 1 ? 'asset' : 'assets'} selected</div>
          <div>
            <button className="secondary-button dark" onClick={onClearSelection}>Clear</button>
            <button className="dark-button" onClick={onDownloadSelection}>Download ZIP</button>
          </div>
        </aside>
      )}
    </main>
  )
}
