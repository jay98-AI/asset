import AudioPlayer from './AudioPlayer.jsx'
import { TYPE_HUES } from '../data/assets.js'
import { formatClock, sceneLabel, voiceoverSeconds } from '../lib/assets.js'
import { StatusBadge } from './ReviewUI.jsx'

export default function AssetCard({ asset, selected = false, onOpen, onSelect, showSelect = true }) {
  const hue = TYPE_HUES[asset.type]

  return (
    <article className={`asset-card ${selected ? 'is-selected' : ''}`}>
      <div className="asset-preview-wrap">
        <button
          className="asset-preview"
          style={{ '--asset-hue': hue }}
          onClick={() => onOpen(asset.id)}
          aria-label={`Open ${asset.name}`}
        >
          <span className="asset-type">{asset.type}</span>
          <span className="preview-mark" aria-hidden="true">AH</span>
        </button>
        {asset.type === 'Voice-over' && (
          <>
            <div className="asset-preview-audio">
              <AudioPlayer asset={asset} compact />
            </div>
            <span className="card-duration">
              <span className="visually-hidden">Duration </span>
              {formatClock(voiceoverSeconds(asset))}
            </span>
          </>
        )}
      </div>
      <div className="asset-card-body">
        <div className="asset-card-title">
          <strong>{asset.name}</strong>
          {showSelect && (
            <button
              className="select-button"
              onClick={() => onSelect(asset.id)}
              aria-label={`${selected ? 'Deselect' : 'Select'} ${asset.name}`}
              aria-pressed={selected}
            >
              {selected && (
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path d="m3.5 8 3 3 6-6" />
                </svg>
              )}
            </button>
          )}
        </div>
        <span className="asset-meta">
          {sceneLabel(asset)}{asset.also?.length ? ` +${asset.also.length} more` : ''} · v{asset.ver}
        </span>
        {asset.reviewStatus && <StatusBadge status={asset.reviewStatus} />}
      </div>
    </article>
  )
}
