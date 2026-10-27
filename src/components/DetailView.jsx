import AudioPlayer from './AudioPlayer.jsx'
import { TYPE_HUES } from '../data/assets.js'
import { assetSpecs, sceneLabel, usesFor } from '../lib/assets.js'

export default function DetailView({
  asset,
  shownVersion,
  isAdmin,
  targetEpisode,
  targetScene,
  deletePending,
  onBack,
  onVersion,
  onDownload,
  onAddVersion,
  onTargetEpisode,
  onTargetScene,
  onLink,
  onRemoveUse,
  onDelete,
}) {
  const hue = TYPE_HUES[asset.type]
  const tags = [...asset.chars, asset.loc, ...asset.props].filter(Boolean)
  const uses = usesFor(asset)

  return (
    <main className="page-shell detail-view">
      <button className="back-button" onClick={onBack}>← Back to library</button>
      <div className="detail-layout">
        <section className="detail-media">
          <div className="detail-preview" style={{ '--asset-hue': hue }}>
            <span className={`version-badge ${shownVersion === asset.ver ? 'latest' : ''}`}>
              V{shownVersion}{shownVersion === asset.ver ? ' · latest' : ''}
            </span>
            {asset.type === 'Voice-over' ? (
              <>
                <AudioPlayer asset={asset} />
                <span>Preview · {asset.type} · sample audio</span>
              </>
            ) : (
              <>
                <span className="preview-symbol" aria-hidden="true" />
                <span>Preview · {asset.type}</span>
              </>
            )}
          </div>
          <div className="version-thumbnails">
            {Array.from({ length: asset.ver }, (_, index) => index + 1).map((version) => (
              <button
                key={version}
                className={shownVersion === version ? 'is-active' : ''}
                style={{ '--asset-hue': hue }}
                onClick={() => onVersion(version)}
              >
                <span>V{version}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="detail-info">
          <div className="detail-type">{asset.type}</div>
          <h1>{asset.name}</h1>
          <p className="detail-location">{sceneLabel(asset)} · {asset.project} · Season 1</p>
          <div className="tag-list">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <div className="used-in">
            <span>Used in</span>
            <div>{uses.map((use) => <span key={`${use.ep}-${use.sc}`}>{sceneLabel(use)}</span>)}</div>
          </div>
          <button className="primary-button download-button" onClick={() => onDownload(shownVersion)}>Download V{shownVersion} <span>↓</span></button>

          {isAdmin && (
            <div className="admin-panel">
              <div className="admin-panel-heading"><span>Admin controls</span><small>Manage this asset</small></div>
              <p>One file can be linked to multiple production scenes.</p>
              <div className="linked-scenes">
                {uses.map((use, index) => (
                  <span key={`${use.ep}-${use.sc}-${index}`}>
                    {sceneLabel(use)}
                    <button onClick={() => onRemoveUse(index)} aria-label={`Remove ${sceneLabel(use)}`}>×</button>
                  </span>
                ))}
              </div>
              <div className="target-scene">
                <input value={targetEpisode} onChange={(event) => onTargetEpisode(event.target.value)} placeholder="Ep" aria-label="Target episode" />
                <input value={targetScene} onChange={(event) => onTargetScene(event.target.value)} placeholder="Scene" aria-label="Target scene" />
                <span>target scene</span>
              </div>
              <div className="admin-actions">
                <button className="secondary-button" onClick={onAddVersion}>+ Add version</button>
                <button className="outline-accent-button" onClick={onLink}>Link to scene</button>
                <button className="danger-button" onClick={onDelete}>{deletePending ? 'Confirm delete?' : 'Delete'}</button>
              </div>
            </div>
          )}

          {asset.model && (
            <div className="ai-note">
              <span>AI generation details</span>
              <strong>{asset.model}</strong>
              <p>{asset.prompt}</p>
            </div>
          )}

          <div className="property-heading"><h2>Properties</h2><span>Asset metadata</span></div>
          <div className="property-grid">
            {assetSpecs(asset).map(([key, value]) => (
              <div key={key}><span>{key}</span><strong>{value}</strong></div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
