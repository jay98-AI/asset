import { describe, expect, it } from 'vitest'
import {
  assetMatches,
  assetSpecs,
  parseScenes,
  parseSearch,
  sceneLabel,
  unique,
  usesFor,
} from '../../src/lib/assets.js'

// Fixtures mirror the real seed shape from src/data/assets.js, including `also` links.
const arjun = {
  id: 1,
  project: 'Moonlit Harbor',
  name: 'Arjun – Character Sheet',
  type: 'Character Sheet',
  ep: 1,
  sc: 3,
  chars: ['Arjun'],
  loc: 'Harbor',
  props: ['Lantern'],
  ver: 4,
  also: [{ ep: 2, sc: 1 }, { ep: 2, sc: 4 }],
}

const neonScript = {
  id: 10,
  project: 'Neon Monsoon',
  name: 'Ep02 Script',
  type: 'Script',
  ep: 2,
  sc: 0,
  chars: ['Arjun', 'Meera'],
  loc: '',
  props: [],
  ver: 3,
}

const noFacets = { projects: [], episodes: [], scenes: [] }
const emptySearch = { ep: null, sc: null, text: [] }

describe('parseSearch', () => {
  const cases = [
    { input: 'ep01', filters: { ep: 1, sc: null, text: [] }, chips: ['Episode 1'] },
    { input: 'episode 3', filters: { ep: 3, sc: null, text: [] }, chips: ['Episode 3'] },
    { input: 'EP02', filters: { ep: 2, sc: null, text: [] }, chips: ['Episode 2'] },
    { input: 'ep007', filters: { ep: 7, sc: null, text: [] }, chips: ['Episode 7'] },
    { input: 'sc03', filters: { ep: null, sc: 3, text: [] }, chips: ['Scene 3'] },
    { input: 'scene 12', filters: { ep: null, sc: 12, text: [] }, chips: ['Scene 12'] },
    { input: 'Sc4', filters: { ep: null, sc: 4, text: [] }, chips: ['Scene 4'] },
    {
      input: 'Arjun, ep01, sc03',
      filters: { ep: 1, sc: 3, text: ['arjun'] },
      chips: ['Name/tag: Arjun', 'Episode 1', 'Scene 3'],
    },
    {
      input: 'ep01, harbour, lantern',
      filters: { ep: 1, sc: null, text: ['harbour', 'lantern'] },
      chips: ['Episode 1', 'Name/tag: harbour', 'Name/tag: lantern'],
    },
    { input: 'ep1x', filters: { ep: null, sc: null, text: ['ep1x'] }, chips: ['Name/tag: ep1x'] },
  ]

  for (const { input, filters, chips } of cases) {
    it(`reads ${JSON.stringify(input)} as ${JSON.stringify(filters)}`, () => {
      expect(parseSearch(input)).toEqual({ chips, filters })
    })
  }

  it('treats blank and comma-only input as no filters', () => {
    for (const input of ['', '   ', ' , , ', ',,,']) {
      expect(parseSearch(input)).toEqual({ chips: [], filters: { ep: null, sc: null, text: [] } })
    }
  })

  it('lowercases free text and keeps term order', () => {
    const parsed = parseSearch('Zebra, Apple, Mango')
    expect(parsed.filters.text).toEqual(['zebra', 'apple', 'mango'])
  })
})

describe('parseScenes', () => {
  const cases = [
    { input: 'ep01 sc03', expected: [{ ep: 1, sc: 3 }] },
    { input: 'ep01 sc03, ep04 sc05', expected: [{ ep: 1, sc: 3 }, { ep: 4, sc: 5 }] },
    { input: 'ep2', expected: [{ ep: 2, sc: 0 }] },
    { input: 'EP2 SC4', expected: [{ ep: 2, sc: 4 }] },
    { input: 'ep05 scene 7', expected: [{ ep: 5, sc: 7 }] },
    { input: 'ep01 sc03, junk', expected: [{ ep: 1, sc: 3 }] },
    { input: 'junk, ep01 sc03', expected: [{ ep: 1, sc: 3 }] },
    { input: 'sc03', expected: [] },
    { input: '', expected: [] },
    { input: 'no numbers here', expected: [] },
  ]

  for (const { input, expected } of cases) {
    it(`parses ${JSON.stringify(input)} to ${JSON.stringify(expected)}`, () => {
      expect(parseScenes(input)).toEqual(expected)
    })
  }

  it('drops entries with no episode rather than inventing one', () => {
    expect(parseScenes('sc01, sc02')).toEqual([])
  })
})

describe('usesFor', () => {
  it('puts the home use first and appends every also link', () => {
    expect(usesFor(arjun)).toEqual([{ ep: 1, sc: 3 }, { ep: 2, sc: 1 }, { ep: 2, sc: 4 }])
  })

  it('tolerates a missing also collection', () => {
    const withoutAlso = { ...arjun }
    delete withoutAlso.also
    expect(usesFor(withoutAlso)).toEqual([{ ep: 1, sc: 3 }])
  })
})

describe('sceneLabel', () => {
  it('labels a specific scene', () => {
    expect(sceneLabel({ ep: 1, sc: 3 })).toBe('Ep 1 · Sc 3')
  })

  it('labels scene 0 as the whole episode', () => {
    expect(sceneLabel({ ep: 2, sc: 0 })).toBe('Ep 2 · all')
  })
})

describe('unique', () => {
  it('dedupes values while keeping first-seen order', () => {
    expect(unique(['b', 'a', 'b', 'c', 'a'])).toEqual(['b', 'a', 'c'])
    expect(unique([3, 1, 3, 2])).toEqual([3, 1, 2])
    expect(unique([])).toEqual([])
  })
})

describe('assetMatches', () => {
  it('matches everything with no search and no facets', () => {
    expect(assetMatches(arjun, emptySearch, 'All', noFacets)).toBe(true)
  })

  it('matches any use entry, including also links', () => {
    expect(assetMatches(arjun, { ep: 1, sc: null, text: [] }, 'All', noFacets)).toBe(true)
    expect(assetMatches(arjun, { ep: 2, sc: null, text: [] }, 'All', noFacets)).toBe(true)
    expect(assetMatches(arjun, { ep: 2, sc: 4, text: [] }, 'All', noFacets)).toBe(true)
  })

  it('requires episode and scene to match the same use entry', () => {
    // ep 2 exists (also) and sc 3 exists (home), but no single use is ep 2 / sc 3.
    expect(assetMatches(arjun, { ep: 2, sc: 3, text: [] }, 'All', noFacets)).toBe(false)
  })

  it('applies type and project facets', () => {
    expect(assetMatches(arjun, emptySearch, 'Keyframe', noFacets)).toBe(false)
    expect(assetMatches(arjun, emptySearch, 'Character Sheet', noFacets)).toBe(true)
    expect(assetMatches(arjun, emptySearch, 'All', { projects: ['Neon Monsoon'], episodes: [], scenes: [] })).toBe(false)
    expect(assetMatches(arjun, emptySearch, 'All', { projects: ['Moonlit Harbor'], episodes: [], scenes: [] })).toBe(true)
  })

  it('applies episode and scene facets against the use entries', () => {
    expect(assetMatches(arjun, emptySearch, 'All', { projects: [], episodes: [2], scenes: [] })).toBe(true)
    expect(assetMatches(arjun, emptySearch, 'All', { projects: [], episodes: [3], scenes: [] })).toBe(false)
    expect(assetMatches(arjun, emptySearch, 'All', { projects: [], episodes: [], scenes: [4] })).toBe(true)
    expect(assetMatches(arjun, emptySearch, 'All', { projects: [], episodes: [], scenes: [2] })).toBe(false)
  })

  it('searches name, project, location, characters, and props case-insensitively', () => {
    for (const term of ['arjun', 'moonlit', 'harbor', 'lantern']) {
      expect(assetMatches(arjun, { ep: null, sc: null, text: [term] }, 'All', noFacets)).toBe(true)
    }
    // Case folding lives in parseSearch: assetMatches expects already-normalised terms.
    expect(assetMatches(arjun, parseSearch('CHARACTER').filters, 'All', noFacets)).toBe(true)
    expect(parseSearch('CHARACTER').filters.text).toEqual(['character'])
  })

  it('requires every free-text term to match (AND semantics)', () => {
    expect(assetMatches(arjun, { ep: null, sc: null, text: ['arjun', 'lantern'] }, 'All', noFacets)).toBe(true)
    expect(assetMatches(arjun, { ep: null, sc: null, text: ['arjun', 'boat'] }, 'All', noFacets)).toBe(false)
  })

  it('does not match an episode-only search against a different episode', () => {
    expect(assetMatches(neonScript, { ep: 1, sc: null, text: [] }, 'All', noFacets)).toBe(false)
    expect(assetMatches(neonScript, { ep: 2, sc: null, text: [] }, 'All', noFacets)).toBe(true)
  })

  it('matches scene 0 searches when the asset is an episode-wide use', () => {
    expect(assetMatches(neonScript, { ep: null, sc: 0, text: [] }, 'All', noFacets)).toBe(true)
  })
})

describe('assetSpecs', () => {
  it('always reports the type and latest version rows', () => {
    const specs = assetSpecs(arjun)
    expect(specs).toContainEqual(['Type', 'Character Sheet'])
    expect(specs).toContainEqual(['Version', 'v4 (latest)'])
  })

  it('uses type-appropriate rows', () => {
    const scriptSpecs = Object.fromEntries(assetSpecs({ ...neonScript, id: 5 }))
    expect(scriptSpecs.Format).toBe('PDF')
    expect(scriptSpecs.Pages).toBe('38')
    expect(scriptSpecs.Words).toBe('5250')

    const voiceSpecs = Object.fromEntries(assetSpecs({ ...neonScript, id: 7, type: 'Voice-over', ver: 1 }))
    expect(voiceSpecs.Format).toBe('WAV 24-bit')
    expect(voiceSpecs.Channels).toBe('Mono')
  })

  it('is deterministic for the same id and type', () => {
    expect(assetSpecs({ ...neonScript, id: 14, type: 'Keyframe' }))
      .toEqual(assetSpecs({ ...neonScript, id: 14, type: 'Keyframe' }))
  })

  it('derives the uploader from the id, matching the current seeded display', () => {
    const uploader = Object.fromEntries(assetSpecs(arjun))['Uploaded by']
    expect(['Anika R.', 'Dev M.', 'Sara K.']).toContain(uploader)
  })
})
