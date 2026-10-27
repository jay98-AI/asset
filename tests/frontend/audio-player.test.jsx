// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App.jsx'
import AudioPlayer from '../../src/components/AudioPlayer.jsx'
import { assetSpecs, formatClock, voiceoverSeconds } from '../../src/lib/assets.js'
import { placeholderClip } from '../../src/lib/audio.js'

// jsdom has no media pipeline, so play/pause are stubbed to emit the events a
// real browser would emit. Everything else runs against the real components.
beforeEach(() => {
  vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(function play() {
    this.dispatchEvent(new Event('play'))
    return Promise.resolve()
  })
  vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(function pause() {
    this.dispatchEvent(new Event('pause'))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

const voiceover = { id: 7, name: 'Arjun VO – Sc03', type: 'Voice-over', ep: 1, sc: 3, ver: 1, chars: [], props: [], loc: '' }

describe('audio helpers', () => {
  it('formats clocks past a minute correctly', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(18)).toBe('0:18')
    expect(formatClock(60)).toBe('1:00')
    expect(formatClock(75)).toBe('1:15')
  })

  it('keeps the player and the metadata panel on the same duration', () => {
    expect(voiceoverSeconds(voiceover)).toBe(18)
    expect(voiceoverSeconds({ ...voiceover, id: 13 })).toBe(60)
    expect(Object.fromEntries(assetSpecs({ ...voiceover, id: 13 })).Duration).toBe('1:00')
  })

  it('builds a cached WAV data URL', () => {
    const clip = placeholderClip(1)
    expect(clip.startsWith('data:audio/wav;base64,')).toBe(true)
    expect(placeholderClip(1)).toBe(clip)
  })
})

describe('voice-over on a card', () => {
  it('plays without opening the asset', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Play Arjun VO – Sc03' }))

    expect(screen.getByRole('button', { name: 'Pause Arjun VO – Sc03' })).toBeInTheDocument()
    // Still on the library: the play control must not trigger the card's open action.
    expect(screen.getByRole('heading', { level: 1, name: 'Find the right asset, fast.' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Arjun VO – Sc03' })).not.toBeInTheDocument()
  })

  it('keeps audio controls off non-audio assets', () => {
    render(<App />)

    expect(screen.queryByRole('button', { name: 'Play Arjun – Character Sheet' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Play Harbor at Dusk' })).not.toBeInTheDocument()
  })

  it('shows the total duration on the card', () => {
    render(<App />)

    // Only the voice-over card carries a duration badge, and it matches the player.
    const badges = document.querySelectorAll('.card-duration')
    expect(badges).toHaveLength(1)
    expect(badges[0]).toHaveTextContent('Duration 0:18')
  })
})

describe('voice-over in the detail view', () => {
  it('shows a transport with a clock and a seek control', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Open Arjun VO – Sc03' }))

    const seek = screen.getByRole('slider', { name: 'Seek Arjun VO – Sc03' })
    expect(seek).toHaveAttribute('min', '0')
    expect(seek).toHaveAttribute('max', '18')
    expect(screen.getByText('0:00')).toBeInTheDocument()
    // Transport clock and the Properties panel both read 0:18 — they must agree.
    expect(screen.getAllByText('0:18')).toHaveLength(2)
    expect(screen.getByText('Preview · Voice-over · sample audio')).toBeInTheDocument()
  })

  it('toggles playback', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Open Arjun VO – Sc03' }))

    fireEvent.click(screen.getByRole('button', { name: 'Play Arjun VO – Sc03' }))
    expect(screen.getByRole('button', { name: 'Pause Arjun VO – Sc03' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Pause Arjun VO – Sc03' }))
    expect(screen.getByRole('button', { name: 'Play Arjun VO – Sc03' })).toBeInTheDocument()
  })
})

describe('one clip at a time', () => {
  it('pauses the first player when a second one starts', () => {
    render(
      <>
        <AudioPlayer asset={{ ...voiceover, name: 'Take A' }} compact />
        <AudioPlayer asset={{ ...voiceover, id: 14, name: 'Take B' }} compact />
      </>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Play Take A' }))
    expect(screen.getByRole('button', { name: 'Pause Take A' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Play Take B' }))

    expect(screen.getByRole('button', { name: 'Play Take A' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pause Take B' })).toBeInTheDocument()
  })
})
