export const unique = (values) => [...new Set(values)]

export const usesFor = (asset) => [
  { ep: asset.ep, sc: asset.sc },
  ...(asset.also ?? []),
]

export const sceneLabel = ({ ep, sc }) => `Ep ${ep}${sc ? ` · Sc ${sc}` : ' · all'}`

export function parseSearch(query) {
  const chips = []
  const filters = { ep: null, sc: null, text: [] }

  query.split(',').map((term) => term.trim()).filter(Boolean).forEach((term) => {
    const episode = term.match(/^ep(?:isode)?\s*0*(\d+)$/i)
    const scene = term.match(/^s(?:c|cene)?\s*0*(\d+)$/i)
    if (episode) {
      filters.ep = Number(episode[1])
      chips.push(`Episode ${episode[1]}`)
    } else if (scene) {
      filters.sc = Number(scene[1])
      chips.push(`Scene ${scene[1]}`)
    } else {
      filters.text.push(term.toLowerCase())
      chips.push(`Name/tag: ${term}`)
    }
  })

  return { chips, filters }
}

export function parseScenes(input) {
  return input.split(',').map((term) => {
    const episode = term.match(/ep\D*?0*(\d+)/i)
    if (!episode) return null
    const remainder = term.replace(episode[0], ' ')
    const scene = remainder.match(/s(?:c|cene)?\D*?0*(\d+)/i)
    return { ep: Number(episode[1]), sc: scene ? Number(scene[1]) : 0 }
  }).filter(Boolean)
}

export function assetMatches(asset, search, type, facets) {
  const useMatch = usesFor(asset).some((use) => (
    (search.ep === null || use.ep === search.ep)
    && (search.sc === null || use.sc === search.sc)
    && (!facets.episodes.length || facets.episodes.includes(use.ep))
    && (!facets.scenes.length || facets.scenes.includes(use.sc))
  ))
  if (!useMatch) return false
  if (type !== 'All' && asset.type !== type) return false
  if (facets.projects.length && !facets.projects.includes(asset.project)) return false

  const haystack = [asset.name, asset.project, asset.loc, ...asset.chars, ...asset.props]
    .join(' ')
    .toLowerCase()
  return search.text.every((term) => haystack.includes(term))
}

export function formatClock(seconds) {
  const total = Math.max(0, Math.round(seconds))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

// Prototype duration for a voice-over, also used by the audio player so the
// transport and the metadata panel cannot drift apart.
export const voiceoverSeconds = (asset) => 18 + (asset.id % 7) * 7

export function assetSpecs(asset) {
  const n = asset.id % 7
  const size = (value) => `${value.toFixed(1)} MB`
  let details

  if (asset.type === 'Voice-over') {
    details = [['Format', 'WAV 24-bit'], ['Duration', formatClock(voiceoverSeconds(asset))], ['Sample rate', '48 kHz'], ['Channels', 'Mono'], ['Size', size(2.4 + n * 0.9)]]
  } else if (asset.type === 'Script') {
    details = [['Format', 'PDF'], ['Pages', String(18 + n * 4)], ['Words', String(3200 + n * 410)], ['Size', size(0.4 + n * 0.1)]]
  } else if (asset.type === 'Storyboard') {
    details = [['Format', 'PDF'], ['Panels', String(12 + n * 3)], ['Page size', 'A4 landscape'], ['Size', size(6 + n * 1.3)]]
  } else if (asset.type === 'Keyframe') {
    details = [['Format', 'PNG'], ['Resolution', '3840 × 2160'], ['Aspect ratio', '16:9'], ['Color space', 'sRGB'], ['Size', size(7 + n * 1.1)]]
  } else {
    details = [['Format', 'PNG'], ['Resolution', '4096 × 4096'], ['Aspect ratio', '1:1'], ['Color space', 'sRGB'], ['Size', size(11 + n * 1.4)]]
  }

  return [
    ...details,
    ['Type', asset.type],
    ['Version', `v${asset.ver} (latest)`],
    ['Uploaded by', ['Anika R.', 'Dev M.', 'Sara K.'][asset.id % 3]],
  ]
}
