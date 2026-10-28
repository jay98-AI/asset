// @vitest-environment jsdom

import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createReviewDemo, decideReview, memberAsset, reviewFor, startReview } from '../../src/lib/reviews.js'
import { NotificationBell, RejectDialog, ReviewQueue, ReviewThread } from '../../src/components/ReviewUI.jsx'
import { INITIAL_ASSETS } from '../../src/data/assets.js'

describe('review visibility and history', () => {
  const asset = INITIAL_ASSETS.find((item) => item.id === 1)
  it('holds new versions back and excludes rejected versions from member navigation', () => {
    const state = createReviewDemo()
    const member = memberAsset(asset, state.reviews)
    expect(member.ver).toBe(1)
    expect(member.availableVersions).toEqual([1])
    const approved = decideReview(state.reviews[1], asset, 'approved')
    expect(memberAsset(asset, { 1: approved }).availableVersions).toEqual([1, 4])
  })
  it('shows a waiting new asset and hides it when rejected', () => {
    const fresh = { ...asset, id: 90, ver: 1 }
    const waiting = startReview(fresh, undefined, 'admin')
    expect(memberAsset(fresh, { 90: waiting })).not.toBeNull()
    const rejected = decideReview(waiting, fresh, 'rejected', 'Please fix the palette')
    expect(memberAsset(fresh, { 90: rejected })).toBeNull()
  })
  it('requires a rejection note and cannot change an existing decision', () => {
    const { reviews } = createReviewDemo()
    expect(decideReview(reviews[1], asset, 'rejected', '   ')).toBe(reviews[1])
    const rejected = decideReview(reviews[1], asset, 'rejected', 'Fix the lantern')
    expect(rejected.entries.at(-1).text).toBe('Fix the lantern')
    expect(decideReview(rejected, asset, 'approved')).toBe(rejected)
  })
  it('starts a new correction round without changing past entries', () => {
    const { reviews } = createReviewDemo()
    const original = reviews[3]
    const corrected = startReview({ ...asset, ver: 3 }, original, 'admin', 'corrected.png')
    expect(corrected.round).toBe(3)
    expect(corrected.approved).toBe(1)
    expect(corrected.status).toBe('waiting')
    expect(corrected.entries.slice(0, -1)).toEqual(original.entries)
    expect(original.entries).toHaveLength(4)
  })
  it('records super-admin automatic approval in the thread', () => {
    const review = startReview(asset, undefined, 'super')
    expect(review.status).toBe('approved')
    expect(review.approved).toBe(asset.ver)
    expect(review.entries.at(-1).text).toContain('Automatically approved')
  })
  it('holds a new version back even when an existing approved asset has no seeded thread', () => {
    const existing = { ...asset, id: 80, ver: 2 }
    const pending = startReview({ ...existing, ver: 3 }, reviewFor(existing, {}), 'admin')
    const member = memberAsset({ ...existing, ver: 3 }, { 80: pending })
    expect(member.ver).toBe(2)
    expect(member.availableVersions).toEqual([2])
  })
})

describe('review screens', () => {
  it('requires meaningful text before sending a rejection and supports Escape', () => {
    const onSubmit = vi.fn(), onClose = vi.fn()
    render(<RejectDialog asset={INITIAL_ASSETS[0]} onSubmit={onSubmit} onClose={onClose} />)
    expect(screen.getByRole('button', { name: 'Send note' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/What needs to be corrected/), { target: { value: '   ' } })
    expect(screen.getByRole('button', { name: 'Send note' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/What needs to be corrected/), { target: { value: 'Match the approved palette' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send note' }))
    expect(onSubmit).toHaveBeenCalledWith('Match the approved palette')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
  it('renders all review rounds chronologically and appends replies through its callback', () => {
    const asset = INITIAL_ASSETS.find((item) => item.id === 1)
    const review = reviewFor(asset, createReviewDemo().reviews)
    const onReply = vi.fn()
    render(<ReviewThread asset={asset} review={review} role="admin" onReply={onReply} />)
    expect(screen.getAllByRole('region', { name: /Round/ }).map((region) => region.getAttribute('aria-label'))).toEqual(['Round 1', 'Round 2', 'Round 3'])
    expect(screen.getByRole('button', { name: 'Send reply' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Reply to thread'), { target: { value: 'Corrected file is ready' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send reply' }))
    expect(onReply).toHaveBeenCalledWith('Corrected file is ready')
    expect(screen.getByLabelText('Reply to thread')).toHaveValue('')
  })
  it('opens the correct notification and marks all read through a separate action', () => {
    const notifications = createReviewDemo().notifications.filter((item) => item.to === 'admin')
    const onOpen = vi.fn(), onReadAll = vi.fn()
    render(<NotificationBell notifications={notifications} onOpen={onOpen} onReadAll={onReadAll} />)
    fireEvent.click(screen.getByRole('button', { name: 'Notifications, 2 unread' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }))
    expect(onReadAll).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: /Dev marked Harbor at Dusk/ }))
    expect(onOpen).toHaveBeenCalledWith(notifications[0])
    expect(screen.queryByRole('region', { name: 'Notifications' })).not.toBeInTheDocument()
  })
  it('has three waiting submissions and links each to its review screen', () => {
    const state = createReviewDemo(), onOpen = vi.fn()
    render(<ReviewQueue assets={INITIAL_ASSETS} reviews={state.reviews} edits={state.edits} tab="Waiting" onTab={vi.fn()} onOpen={onOpen} />)
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(4)
    fireEvent.click(within(table).getByRole('button', { name: /Arjun on the Pier/ }))
    expect(onOpen).toHaveBeenCalledWith(4)
  })
})
