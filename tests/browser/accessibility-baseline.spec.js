import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// This spec records the accessibility baseline; it does not require a clean result.
// UX-01 ("no serious or critical issues") stays planned until approved fixes land in
// Phase 5. The spec fails only if a scan cannot run or the artifact is malformed.

const OUTPUT = path.join('docs', 'quality', 'a11y-baseline.json')

const surfaces = {
  search: async () => {},
  browse: async (page) => page.getByRole('button', { name: 'Browse', exact: true }).click(),
  detail: async (page) => page.getByRole('button', { name: 'Open Arjun – Character Sheet' }).click(),
  login: async (page) => page.getByRole('button', { name: 'Admin', exact: true }).click(),
  admin: async (page) => {
    await page.getByRole('button', { name: 'Admin', exact: true }).click()
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Unlock' }).click()
    await page.getByRole('heading', { level: 1, name: 'Upload and manage' }).waitFor()
  },
  // The admin detail panel (link, version, delete controls) is a distinct surface.
  adminDetail: async (page) => {
    await page.getByRole('button', { name: 'Admin', exact: true }).click()
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Unlock' }).click()
    await page.getByRole('heading', { level: 1, name: 'Upload and manage' }).waitFor()
    await page.getByRole('button', { name: /Arjun – Character Sheet/ }).click()
    await page.getByRole('heading', { level: 1, name: 'Arjun – Character Sheet' }).waitFor()
  },
}

test('records the accessibility baseline for every surface', async ({ page }) => {
  const results = {}

  for (const [name, act] of Object.entries(surfaces)) {
    await page.goto('/')
    await act(page)
    await page.waitForTimeout(150)

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    results[name] = violations
      .map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.length,
        sampleTarget: violation.nodes[0]?.target?.join(' ') ?? null,
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  }

  // Phones are the viewport where the episode tree disappears, so scan there too.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.waitForTimeout(150)
  const mobile = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  results['search-mobile'] = mobile.violations
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.length,
      sampleTarget: violation.nodes[0]?.target?.join(' ') ?? null,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))

  fs.writeFileSync(OUTPUT, `${JSON.stringify(results, null, 2)}\n`)

  // Shape assertions: the scan really ran on every surface.
  expect(Object.keys(results)).toEqual(['search', 'browse', 'detail', 'login', 'admin', 'adminDetail', 'search-mobile'])
  for (const [name, violations] of Object.entries(results)) {
    expect(Array.isArray(violations), `${name} must produce a violation list`).toBe(true)
    for (const violation of violations) {
      expect(violation.id, `${name} rule id`).toBeTruthy()
      expect(['minor', 'moderate', 'serious', 'critical'], `${name} ${violation.id} impact`)
        .toContain(violation.impact)
      expect(violation.nodes, `${name} ${violation.id} nodes`).toBeGreaterThan(0)
    }
  }
})
