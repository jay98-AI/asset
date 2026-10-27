import { describe, expect, it } from 'vitest'
import { parseSearch } from '../../src/lib/assets.js'

describe('parseSearch', () => {
  it('interprets an episode token from the production helper', () => {
    expect(parseSearch('ep01')).toEqual({
      chips: ['Episode 1'],
      filters: { ep: 1, sc: null, text: [] },
    })
  })
})
