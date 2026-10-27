import { useEffect, useMemo, useRef, useState } from 'react'
import { formatClock, voiceoverSeconds } from '../lib/assets.js'
import { audioSource } from '../lib/audio.js'

// Only one clip plays at a time across cards and the detail view.
let activeAudio = null

function TransportIcon({ playing }) {
  return playing ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 5.2v13.6L19.5 12z" />
    </svg>
  )
}

/**
 * Play/pause for a voice-over asset.
 * `compact` renders the single button used on cards; the full player adds a
 * seek bar and clock for the detail view.
 */
export default function AudioPlayer({ asset, compact = false }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const duration = voiceoverSeconds(asset)
  const source = useMemo(() => audioSource(asset), [asset])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    const syncTime = () => setCurrent(audio.currentTime)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => {
      setPlaying(false)
      setCurrent(0)
      audio.currentTime = 0
    }

    audio.addEventListener('timeupdate', syncTime)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', syncTime)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      if (activeAudio === audio) activeAudio = null
    }
  }, [])

  async function toggle() {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      return
    }

    if (activeAudio && activeAudio !== audio) activeAudio.pause()
    activeAudio = audio

    try {
      await audio.play()
    } catch {
      setPlaying(false)
    }
  }

  function seek(event) {
    const audio = audioRef.current
    const next = Number(event.target.value)
    if (audio) audio.currentTime = next
    setCurrent(next)
  }

  const progress = duration ? Math.min(100, (current / duration) * 100) : 0

  // Deterministic per asset, so the shape does not flicker between renders.
  const bars = useMemo(
    () => Array.from({ length: 44 }, (_, index) => {
      const wave = Math.abs(Math.sin((index + 1) * ((asset.id % 5) + 1.7)))
      return Math.round(16 + wave * 84)
    }),
    [asset.id],
  )

  return (
    <div className={compact ? 'audio-compact' : 'audio-player'}>
      {!compact && (
        <div className="audio-wave" aria-hidden="true">
          {bars.map((height, index) => (
            <span
              key={index}
              style={{ height: `${height}%`, opacity: index / bars.length <= progress / 100 ? 1 : 0.24 }}
            />
          ))}
        </div>
      )}

      <div className="audio-transport">
        <button
          type="button"
          className={`audio-toggle ${playing ? 'is-playing' : ''}`}
          onClick={toggle}
          aria-label={`${playing ? 'Pause' : 'Play'} ${asset.name}`}
        >
          <TransportIcon playing={playing} />
        </button>

        {!compact && (
          <div className="audio-track">
            <input
              type="range"
              className="audio-seek"
              min="0"
              max={duration}
              step="0.1"
              value={current}
              onChange={seek}
              style={{ '--progress': `${progress}%` }}
              aria-label={`Seek ${asset.name}`}
            />
            <div className="audio-times">
              <span>{formatClock(current)}</span>
              <span>{formatClock(duration)}</span>
            </div>
          </div>
        )}
      </div>

      <audio ref={audioRef} src={source} preload="metadata" />
    </div>
  )
}
