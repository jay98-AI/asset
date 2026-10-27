export const ASSET_TYPES = [
  'Character Sheet',
  'Location',
  'Keyframe',
  'Script',
  'Storyboard',
  'Voice-over',
]

export const TYPE_HUES = {
  'Character Sheet': 30,
  Location: 190,
  Keyframe: 280,
  Script: 100,
  Storyboard: 340,
  'Voice-over': 55,
}

export const INITIAL_ASSETS = [
  { id: 13, project: 'Neon Monsoon', name: 'Rhea – Character Sheet', type: 'Character Sheet', ep: 1, sc: 2, chars: ['Rhea'], loc: 'Night Market', props: ['Umbrella'], ver: 1 },
  { id: 14, project: 'Neon Monsoon', name: 'Night Market Keyframe', type: 'Keyframe', ep: 1, sc: 2, chars: ['Rhea', 'Arjun'], loc: 'Night Market', props: ['Umbrella'], ver: 2 },
  { id: 1, project: 'Moonlit Harbor', name: 'Arjun – Character Sheet', type: 'Character Sheet', ep: 1, sc: 3, chars: ['Arjun'], loc: 'Harbor', props: ['Lantern'], ver: 4, also: [{ ep: 2, sc: 1 }, { ep: 2, sc: 4 }], model: 'Flux Pro', prompt: 'Weathered fisherman, 40s, linen coat, cinematic, three-quarter turnaround' },
  { id: 2, project: 'Moonlit Harbor', name: 'Meera – Character Sheet', type: 'Character Sheet', ep: 1, sc: 3, chars: ['Meera'], loc: 'Harbor', props: [], ver: 2, also: [{ ep: 2, sc: 1 }] },
  { id: 3, project: 'Moonlit Harbor', name: 'Harbor at Dusk', type: 'Location', ep: 1, sc: 3, chars: [], loc: 'Harbor', props: ['Boat'], ver: 1, model: 'Midjourney v7', prompt: 'Fishing harbor at dusk, teal haze, lanterns' },
  { id: 4, project: 'Moonlit Harbor', name: 'Arjun on the Pier', type: 'Keyframe', ep: 1, sc: 3, chars: ['Arjun'], loc: 'Harbor', props: ['Lantern'], ver: 1, model: 'Veo 3', prompt: 'Wide shot, Arjun walks the pier' },
  { id: 5, project: 'Moonlit Harbor', name: 'Ep01 Script', type: 'Script', ep: 1, sc: 0, chars: ['Arjun', 'Meera'], loc: '', props: [], ver: 5 },
  { id: 6, project: 'Moonlit Harbor', name: 'Sc03 Storyboard', type: 'Storyboard', ep: 1, sc: 3, chars: ['Arjun', 'Meera'], loc: 'Harbor', props: [], ver: 2 },
  { id: 7, project: 'Moonlit Harbor', name: 'Arjun VO – Sc03', type: 'Voice-over', ep: 1, sc: 3, chars: ['Arjun'], loc: '', props: [], ver: 1 },
  { id: 8, project: 'Moonlit Harbor', name: 'Lighthouse Interior', type: 'Location', ep: 2, sc: 1, chars: [], loc: 'Lighthouse', props: ['Map'], ver: 1 },
  { id: 9, project: 'Moonlit Harbor', name: 'Meera at the Window', type: 'Keyframe', ep: 2, sc: 1, chars: ['Meera'], loc: 'Lighthouse', props: ['Map'], ver: 2 },
  { id: 10, project: 'Moonlit Harbor', name: 'Ep02 Script', type: 'Script', ep: 2, sc: 0, chars: ['Arjun', 'Meera'], loc: '', props: [], ver: 3 },
  { id: 11, project: 'Moonlit Harbor', name: 'Arjun – Storm Keyframe', type: 'Keyframe', ep: 2, sc: 4, chars: ['Arjun'], loc: 'Harbor', props: ['Boat'], ver: 1 },
  { id: 12, project: 'Moonlit Harbor', name: 'Old Map', type: 'Location', ep: 2, sc: 1, chars: [], loc: 'Lighthouse', props: ['Map'], ver: 1 },
]
