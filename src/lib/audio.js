import { voiceoverSeconds } from './assets.js'

// Prototype audio source.
//
// There is no media storage yet, so voice-over assets get a generated clip whose
// length matches the duration shown in Properties. When the asset API lands,
// set `asset.audio` (a URL) and it is used instead — nothing else changes.

const SAMPLE_RATE = 8000
const cache = new Map()

function writeAscii(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index))
  }
}

/** Builds a PCM WAV data URL: a soft two-partial tone with fades and tremolo. */
export function placeholderClip(seconds) {
  const duration = Math.max(1, Math.round(seconds))
  if (cache.has(duration)) return cache.get(duration)

  const samples = duration * SAMPLE_RATE
  const buffer = new ArrayBuffer(44 + samples * 2)
  const view = new DataView(buffer)

  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + samples * 2, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeAscii(view, 36, 'data')
  view.setUint32(40, samples * 2, true)

  for (let index = 0; index < samples; index += 1) {
    const time = index / SAMPLE_RATE
    const envelope = Math.max(0, Math.min(1, time / 0.2, (duration - time) / 0.4))
    const tremolo = 0.72 + 0.28 * Math.sin(2 * Math.PI * 0.7 * time)
    const tone = Math.sin(2 * Math.PI * 196 * time) + 0.35 * Math.sin(2 * Math.PI * 294 * time)
    view.setInt16(44 + index * 2, Math.round(tone * tremolo * envelope * 3600), true)
  }

  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }

  const url = `data:audio/wav;base64,${btoa(binary)}`
  cache.set(duration, url)
  return url
}

/** Real file if the record has one, otherwise the generated prototype clip. */
export const audioSource = (asset) => asset.audio ?? placeholderClip(voiceoverSeconds(asset))
