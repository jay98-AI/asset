// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../src/App.jsx'

describe('App', () => {
  it('renders the initial asset search screen', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Find the right asset, fast.' })).toBeInTheDocument()
  })

  it('switches theme and records the preference', () => {
    render(<App />)
    const previousTheme = document.documentElement.dataset.theme
    fireEvent.click(screen.getByRole('button', { name: /Switch to (light|dark) theme/ }))
    expect(document.documentElement.dataset.theme).not.toBe(previousTheme)
    expect(window.localStorage.getItem('asset-hub-theme')).toBe(document.documentElement.dataset.theme)
  })

  it('switches between the grid and list layouts', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'List' }))
    expect(document.querySelector('.asset-list')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Grid' }))
    expect(document.querySelector('.asset-grid')).toBeInTheDocument()
  })
})
