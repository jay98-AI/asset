import AssetCard from './AssetCard.jsx'
import { TypeFilters } from './Filters.jsx'
import { unique, usesFor } from '../lib/assets.js'

export default function BrowseView({ assets, project, episode, scene, type, types, onProject, onEpisode, onScene, onType, onOpen }) {
  const projects = unique(assets.map((asset) => asset.project)).sort()
  const projectAssets = assets.filter((asset) => asset.project === project)
  const episodes = unique(projectAssets.flatMap(usesFor).map((use) => use.ep)).sort((a, b) => a - b)
  const scenesFor = (ep) => unique(projectAssets.flatMap(usesFor).filter((use) => use.ep === ep && use.sc).map((use) => use.sc)).sort((a, b) => a - b)
  const visible = projectAssets.filter((asset) => (
    usesFor(asset).some((use) => use.ep === episode && (!scene || use.sc === scene))
    && (type === 'All' || asset.type === type)
  ))

  return (
    <main className="browse-view">
      <aside className="browse-sidebar" aria-label="Browse project hierarchy">
        <div className="browse-workspace-title">
          <span>Browse</span>
          <small>{projectAssets.length} approved assets</small>
        </div>
        <div className="sidebar-label">Project</div>
        <select value={project} onChange={(event) => onProject(event.target.value)} aria-label="Project">
          {projects.map((item) => <option key={item}>{item}</option>)}
        </select>
        <div className="sidebar-label season-label">Season 1</div>
        <div className="tree">
          {episodes.map((item) => (
            <div key={item}>
              <button className={episode === item && !scene ? 'is-active episode' : 'episode'} onClick={() => onEpisode(item)}>
                <span>Episode {String(item).padStart(2, '0')}</span>
                <small>{projectAssets.filter((asset) => usesFor(asset).some((use) => use.ep === item)).length}</small>
              </button>
              {episode === item && scenesFor(item).map((sceneNumber) => (
                <button key={sceneNumber} className={scene === sceneNumber ? 'is-active scene' : 'scene'} onClick={() => onScene(sceneNumber)}>
                  <span>Scene {String(sceneNumber).padStart(2, '0')}</span>
                  <small>{projectAssets.filter((asset) => usesFor(asset).some((use) => use.ep === item && use.sc === sceneNumber)).length}</small>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>
      <section className="browse-content">
        <div className="breadcrumb">{project} <span>/</span> Season 1 <span>/</span> Episode {episode}{scene ? <> <span>/</span> Scene {scene}</> : ''}</div>
        <div className="browse-heading">
          <div>
            <div className="eyebrow">{scene ? `Scene ${String(scene).padStart(2, '0')}` : `Episode ${String(episode).padStart(2, '0')}`}</div>
            <h1>{scene ? 'Scene assets' : 'Episode assets'}</h1>
          </div>
          <span>{visible.length} {visible.length === 1 ? 'asset' : 'assets'}</span>
        </div>
        <TypeFilters types={types} current={type} onChange={onType} />
        {visible.length ? (
          <div className="asset-grid browse-grid">
            {visible.map((asset) => <AssetCard key={asset.id} asset={asset} onOpen={onOpen} showSelect={false} />)}
          </div>
        ) : (
          <div className="empty-state compact"><h2>No assets in this view</h2><p>Choose a different type or scene.</p></div>
        )}
      </section>
    </main>
  )
}
