// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../src/App.jsx'

// F-A11Y-06 gave the search field an accessible name, so it is now queried the way a
// screen reader or a testing library user would reach it.
const searchBox = () => screen.getByRole('textbox', { name: 'Search assets' })
const resultCount = () => screen.getByText(/^\d+ assets?$/).textContent
const setup = () => render(<App />)

describe('member search', () => {
  it('filters the grid by free text and echoes how the query was read', () => {
    setup()

    fireEvent.change(searchBox(), { target: { value: 'Arjun' } })

    expect(screen.getByText('Name/tag: Arjun')).toBeInTheDocument()
    expect(resultCount()).toBe('8 assets')
    expect(screen.getByRole('button', { name: 'Open Arjun – Character Sheet' })).toBeInTheDocument()
  })

  it('narrows to an episode when the query uses an episode token', () => {
    setup()

    fireEvent.change(searchBox(), { target: { value: 'ep01' } })

    expect(screen.getByText('Episode 1')).toBeInTheDocument()
    expect(resultCount()).toBe('9 assets')
  })

  it('combines free text with an episode token (AND semantics)', () => {
    setup()

    fireEvent.change(searchBox(), { target: { value: 'Arjun, ep02' } })

    expect(screen.getByText('Name/tag: Arjun')).toBeInTheDocument()
    expect(screen.getByText('Episode 2')).toBeInTheDocument()
    expect(resultCount()).toBe('3 assets')
    expect(screen.getByRole('button', { name: 'Open Ep02 Script' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open Arjun on the Pier' })).not.toBeInTheDocument()
  })

  it('filters by asset type chip', () => {
    setup()

    fireEvent.click(screen.getByRole('button', { name: 'Keyframe' }))

    expect(resultCount()).toBe('4 assets')
  })

  it('filters by project and restores every asset with Clear all', () => {
    setup()

    fireEvent.click(screen.getByRole('button', { name: 'Project' }))
    fireEvent.click(screen.getByRole('button', { name: 'Neon Monsoon' }))

    expect(resultCount()).toBe('2 assets')

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))

    expect(resultCount()).toBe('14 assets')
  })

  it('lists episode options in numeric ascending order', () => {
    setup()

    fireEvent.click(screen.getByRole('button', { name: 'Episode' }))

    const options = screen
      .getAllByRole('button', { name: /^Episode \d+$/ })
      .map((option) => option.textContent)

    expect(options).toEqual(['Episode 1', 'Episode 2'])
  })

  it('shows an empty state that resets the search', () => {
    setup()

    fireEvent.change(searchBox(), { target: { value: 'no-such-asset' } })

    expect(screen.getByRole('heading', { name: 'No matching assets' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reset search' }))

    expect(resultCount()).toBe('14 assets')
    expect(searchBox()).toHaveValue('')
  })
})

describe('member browse', () => {
  it('opens the project tree at the first episode', () => {
    setup()

    fireEvent.click(screen.getByRole('button', { name: 'Browse' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Episode assets' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Project' })).toBeInTheDocument()
    expect(screen.getByText('7 assets')).toBeInTheDocument()
  })

  it('drills from episode into scene', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Browse' }))

    fireEvent.click(screen.getByRole('button', { name: /Episode 02/ }))
    expect(screen.getByText('7 assets')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Scene 01/ }))

    expect(screen.getByRole('heading', { level: 1, name: 'Scene assets' })).toBeInTheDocument()
    expect(screen.getByText('5 assets')).toBeInTheDocument()
  })
})

describe('member detail', () => {
  const openAsset = (name = 'Arjun – Character Sheet') => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: `Open ${name}` }))
  }

  it('shows the asset, its latest version, and every scene it is used in', () => {
    openAsset()

    expect(screen.getByRole('heading', { level: 1, name: 'Arjun – Character Sheet' })).toBeInTheDocument()
    expect(screen.getByText('V1 · latest')).toBeInTheDocument()
    expect(screen.getByText('Ep 1 · Sc 3')).toBeInTheDocument()
    expect(screen.getByText('Ep 2 · Sc 1')).toBeInTheDocument()
    expect(screen.getByText('Ep 2 · Sc 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download V1/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'V2' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'V4' })).not.toBeInTheDocument()
  })

  it('switches to an older version and marks it as not latest', () => {
    openAsset('Meera – Character Sheet')

    fireEvent.click(screen.getByRole('button', { name: 'V1' }))

    expect(screen.getByText('V1', { selector: '.version-badge' })).toBeInTheDocument()
    expect(screen.queryByText('V1 · latest')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download V1/ })).toBeInTheDocument()
  })

  it('simulates the download of the shown version', () => {
    openAsset()

    fireEvent.click(screen.getByRole('button', { name: /Download V1/ }))

    expect(screen.getByRole('status')).toHaveTextContent('Downloading Arjun – Character Sheet v1')
  })

  it('returns to the library from the back button', () => {
    openAsset()

    fireEvent.click(screen.getByRole('button', { name: '← Back to library' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Find the right asset, fast.' })).toBeInTheDocument()
  })
})

describe('member bulk selection', () => {
  it('selects assets, simulates the ZIP download, and clears the tray', () => {
    setup()

    fireEvent.click(screen.getByRole('button', { name: 'Select Arjun – Character Sheet' }))
    expect(screen.getByText('1', { selector: 'aside.selection-tray strong' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Select Meera – Character Sheet' }))
    expect(screen.getByText('2', { selector: 'aside.selection-tray strong' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Download ZIP' }))

    expect(screen.getByRole('status')).toHaveTextContent('Preparing 2 assets as assets.zip')
    expect(screen.queryByRole('button', { name: 'Download ZIP' })).not.toBeInTheDocument()
  })

  it('clears the selection without downloading', () => {
    setup()

    fireEvent.click(screen.getByRole('button', { name: 'Select Arjun – Character Sheet' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))

    expect(screen.queryByRole('button', { name: 'Download ZIP' })).not.toBeInTheDocument()
  })

  it('reflects selection state on the toggle button', () => {
    setup()

    const toggle = screen.getByRole('button', { name: 'Select Arjun – Character Sheet' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(toggle)

    expect(screen.getByRole('button', { name: 'Deselect Arjun – Character Sheet' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
