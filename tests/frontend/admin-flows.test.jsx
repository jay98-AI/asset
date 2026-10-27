// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../src/App.jsx'

const setup = () => render(<App />)

function unlock() {
  fireEvent.click(screen.getByRole('button', { name: 'Admin' }))
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Unlock' }))
}

const activeCount = () => screen.getByText('active assets').previousElementSibling.textContent

// "Used in" and the admin linked-scenes list both render the same scene label,
// so scene assertions are scoped to the read-only "Used in" block.
const usedIn = (label) => screen.getByText(label, { selector: '.used-in span' })
const queryUsedIn = (label) => screen.queryByText(label, { selector: '.used-in span' })

/** Fills the publish form. Fields are located by their wrapping labels. */
function fillForm({ project, name, scenes, type, version }) {
  if (project !== undefined) {
    fireEvent.change(screen.getByLabelText(/Project \*/), { target: { value: project } })
  }
  if (type !== undefined) {
    fireEvent.change(screen.getByLabelText(/Asset type/), { target: { value: type } })
  }
  if (name !== undefined) {
    fireEvent.change(screen.getByLabelText(/Asset name/), { target: { value: name } })
  }
  if (scenes !== undefined) {
    fireEvent.change(screen.getByLabelText(/Scenes|Episode \*/), { target: { value: scenes } })
  }
  if (version !== undefined) {
    fireEvent.change(screen.getByLabelText(/Version/), { target: { value: version } })
  }
}

const publish = () => fireEvent.click(screen.getByRole('button', { name: /Publish asset/ }))

describe('admin unlock', () => {
  it('rejects a wrong password without leaving the dialog open to member work', () => {
    setup()

    fireEvent.click(screen.getByRole('button', { name: 'Admin' }))
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'not-the-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Incorrect password')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument()
  })

  it('announces the error and marks the field invalid', () => {
    setup()

    fireEvent.click(screen.getByRole('button', { name: 'Admin' }))
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }))

    const message = screen.getByRole('alert')
    expect(message).toHaveTextContent('Incorrect password')

    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'admin-login-error')
  })

  it('cancels back to member mode', () => {
    setup()

    fireEvent.click(screen.getByRole('button', { name: 'Admin' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument()
  })

  it('unlocks the admin workspace with the prototype password', () => {
    setup()
    unlock()

    expect(screen.getByRole('heading', { level: 1, name: 'Upload and manage' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Admin workspace unlocked')
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()
  })
})

describe('admin publish validation', () => {
  it('requires a project', () => {
    setup()
    unlock()

    publish()

    expect(screen.getByRole('status')).toHaveTextContent('Select a project or enter a new project name')
  })

  it('requires an asset name and a valid scene', () => {
    setup()
    unlock()
    fillForm({ project: 'Moonlit Harbor' })

    publish()

    expect(screen.getByRole('status')).toHaveTextContent('Add an asset name and a valid episode or scene')
  })

  it('requires a version for scripts', () => {
    setup()
    unlock()
    fillForm({ project: 'Moonlit Harbor', type: 'Script', name: 'Ep03 Script', scenes: 'ep03' })
    expect(screen.getByLabelText(/Version/)).toBeInTheDocument()

    publish()

    expect(screen.getByRole('status')).toHaveTextContent('Enter the script version number')
  })

  it('rejects an unparseable scene string', () => {
    setup()
    unlock()
    fillForm({ project: 'Moonlit Harbor', name: 'No Scene Asset', scenes: 'not-a-scene' })

    publish()

    expect(screen.getByRole('status')).toHaveTextContent('Add an asset name and a valid episode or scene')
  })
})

describe('admin publish success', () => {
  it('adds the asset, increments the count, and resets the form', () => {
    setup()
    unlock()
    expect(activeCount()).toBe('14')

    fillForm({ project: 'Moonlit Harbor', name: 'Pier Test Sheet', scenes: 'ep03 sc02' })
    publish()

    expect(screen.getByRole('status')).toHaveTextContent('Asset published')
    expect(activeCount()).toBe('15')
    expect(screen.getByRole('button', { name: /Pier Test Sheet/ })).toBeInTheDocument()
    expect(screen.getByLabelText(/Asset name/)).toHaveValue('')
  })

  it('creates an asset under a brand new project', () => {
    setup()
    unlock()

    fillForm({ project: '__new' })
    fireEvent.change(screen.getByLabelText(/New project name/), { target: { value: 'Alpha Unit' } })
    fillForm({ name: 'Alpha Keyframe', scenes: 'ep01 sc01' })
    publish()

    expect(screen.getByRole('status')).toHaveTextContent('Asset published')
    expect(screen.getByRole('button', { name: /Alpha Keyframe/ })).toBeInTheDocument()
  })
})

describe('admin scene linking', () => {
  const openManaged = (name) => {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }))
  }

  it('requires a target episode', () => {
    setup()
    unlock()
    openManaged('Arjun – Character Sheet')

    fireEvent.click(screen.getByRole('button', { name: 'Link to scene' }))

    expect(screen.getByRole('status')).toHaveTextContent('Enter a target episode')
  })

  it('rejects a non-numeric episode instead of coercing it', () => {
    setup()
    unlock()
    openManaged('Arjun – Character Sheet')

    fireEvent.change(screen.getByLabelText('Target episode'), { target: { value: '3x' } })
    fireEvent.click(screen.getByRole('button', { name: 'Link to scene' }))

    expect(screen.getByRole('status')).toHaveTextContent('Enter a whole-number episode')
  })

  it('rejects a non-numeric scene instead of silently meaning "all scenes"', () => {
    setup()
    unlock()
    openManaged('Arjun – Character Sheet')

    fireEvent.change(screen.getByLabelText('Target episode'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('Target scene'), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: 'Link to scene' }))

    expect(screen.getByRole('status')).toHaveTextContent('Enter a whole-number scene, or leave it blank')
    expect(queryUsedIn('Ep 3 · all')).not.toBeInTheDocument()
  })

  it('links the asset to a new scene', () => {
    setup()
    unlock()
    openManaged('Arjun – Character Sheet')

    fireEvent.change(screen.getByLabelText('Target episode'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('Target scene'), { target: { value: '7' } })
    fireEvent.click(screen.getByRole('button', { name: 'Link to scene' }))

    expect(screen.getByRole('status')).toHaveTextContent('Linked to Episode 3, Scene 7')
    expect(usedIn('Ep 3 · Sc 7')).toBeInTheDocument()
  })

  it('refuses a duplicate link', () => {
    setup()
    unlock()
    openManaged('Arjun – Character Sheet')

    fireEvent.change(screen.getByLabelText('Target episode'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Target scene'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Link to scene' }))

    expect(screen.getByRole('status')).toHaveTextContent('Asset is already linked there')
  })

  it('refuses to remove the last remaining use', () => {
    setup()
    unlock()
    openManaged('Harbor at Dusk')

    fireEvent.click(screen.getByRole('button', { name: 'Remove Ep 1 · Sc 3' }))

    expect(screen.getByRole('status')).toHaveTextContent('An asset needs at least one episode or scene')
    expect(usedIn('Ep 1 · Sc 3')).toBeInTheDocument()
  })

  it('removes one of several uses', () => {
    setup()
    unlock()
    openManaged('Arjun – Character Sheet')

    fireEvent.click(screen.getByRole('button', { name: 'Remove Ep 2 · Sc 4' }))

    expect(queryUsedIn('Ep 2 · Sc 4')).not.toBeInTheDocument()
    expect(usedIn('Ep 1 · Sc 3')).toBeInTheDocument()
  })
})

describe('admin versions', () => {
  it('adds a version after a simulated file selection', () => {
    setup()
    unlock()
    fireEvent.click(screen.getByRole('button', { name: /Arjun – Character Sheet/ }))

    fireEvent.click(screen.getByRole('button', { name: '+ Add version' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Choose a file/ }))
    expect(screen.getByText('Arjun_Character_Sheet_v5.png')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Upload V5' }))

    expect(screen.getByRole('status')).toHaveTextContent('Version 5 uploaded')
    expect(screen.getByText('V5 · latest')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'V5' })).toBeInTheDocument()
  })

  it('cancels without changing the version', () => {
    setup()
    unlock()
    fireEvent.click(screen.getByRole('button', { name: /Arjun – Character Sheet/ }))

    fireEvent.click(screen.getByRole('button', { name: '+ Add version' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('V4 · latest')).toBeInTheDocument()
  })
})

describe('admin deletion', () => {
  it('requires a second confirmation click', () => {
    setup()
    unlock()
    fireEvent.click(screen.getByRole('button', { name: /Old Map/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.getByRole('button', { name: 'Confirm delete?' })).toBeInTheDocument()
    expect(screen.queryByText('Asset deleted')).not.toBeInTheDocument()
  })

  it('deletes after confirmation and returns to the manage list', () => {
    setup()
    unlock()
    fireEvent.click(screen.getByRole('button', { name: /Old Map/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete?' }))

    expect(screen.getByRole('status')).toHaveTextContent('Asset deleted')
    expect(screen.queryByRole('button', { name: /Old Map/ })).not.toBeInTheDocument()
    expect(activeCount()).toBe('13')
  })
})

describe('member/admin switching', () => {
  it('returns to member mode and hides admin navigation', () => {
    setup()
    unlock()

    fireEvent.click(screen.getByRole('button', { name: 'Member' }))

    expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Find the right asset, fast.' })).toBeInTheDocument()
  })
})

describe('data integrity', () => {
  it('gives two same-tick publishes distinct ids, so deleting one spares the other', () => {
    setup()
    unlock()

    fillForm({ project: 'Moonlit Harbor', name: 'Rapid A', scenes: 'ep03 sc01' })
    publish()
    fillForm({ project: 'Moonlit Harbor', name: 'Rapid B', scenes: 'ep03 sc02' })
    publish()

    expect(screen.getByRole('button', { name: /Rapid A/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Rapid B/ })).toBeInTheDocument()

    // Delete only Rapid A; Rapid B must survive.
    fireEvent.click(screen.getByRole('button', { name: /Rapid A/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete?' }))

    expect(screen.getByRole('button', { name: /Rapid B/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Rapid A/ })).not.toBeInTheDocument()
  })

  it('lands on Search with the empty state after deleting the last asset', () => {
    setup()
    unlock()

    // Delete every seeded asset through the real confirmation flow.
    for (let guard = 0; guard < 20; guard += 1) {
      const row = screen.queryAllByRole('button').find((button) => /v\d+→$/.test(button.textContent.trim()))
      if (!row) break
      fireEvent.click(row)
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
      fireEvent.click(screen.getByRole('button', { name: 'Confirm delete?' }))
    }

    expect(screen.getByRole('heading', { level: 1, name: 'Find the right asset, fast.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No matching assets' })).toBeInTheDocument()
  })
})
