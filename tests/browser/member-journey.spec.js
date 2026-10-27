import { expect, test } from '@playwright/test'

// Fresh state: Playwright gives every test its own browser context, so this journey
// always starts from the seeded in-memory library.

test('member discovers, inspects, selects, and downloads', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Asset Hub')
  await expect(page.getByRole('heading', { level: 1, name: 'Find the right asset, fast.' })).toBeVisible()
  await expect(page.getByText('14 assets')).toBeVisible()

  // Discovery: free text plus an episode token, with the interpretation chips.
  await page.getByPlaceholder('Try: Arjun, ep01, sc03').fill('Arjun, ep01')
  await expect(page.getByText('Name/tag: Arjun')).toBeVisible()
  await expect(page.getByText('Episode 1', { exact: true })).toBeVisible()
  await expect(page.getByText('6 assets')).toBeVisible()

  // Inspection: open the asset, check its metadata, switch versions.
  await page.getByRole('button', { name: 'Open Arjun – Character Sheet' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Arjun – Character Sheet' })).toBeVisible()
  await expect(page.getByText('V4 · latest')).toBeVisible()
  await expect(page.getByText('Ep 2 · Sc 4')).toBeVisible()

  await page.getByRole('button', { name: 'V2' }).click()
  await expect(page.locator('.version-badge')).toHaveText('V2')

  // Simulated download of the shown version.
  await page.getByRole('button', { name: /Download V2/ }).click()
  await expect(page.getByRole('status')).toHaveText('Downloading Arjun – Character Sheet v2')

  // Bulk selection and the ZIP simulation.
  await page.getByRole('button', { name: '← Back to library' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Find the right asset, fast.' })).toBeVisible()

  // Returning to search keeps the query, so clear it before a fresh selection.
  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(page.getByText('14 assets')).toBeVisible()

  await page.getByRole('button', { name: 'Select Arjun – Character Sheet' }).click()
  await page.getByRole('button', { name: 'Select Meera – Character Sheet' }).click()
  await expect(page.locator('.selection-tray strong')).toHaveText('2')

  await page.getByRole('button', { name: 'Download ZIP' }).click()
  await expect(page.getByRole('status')).toHaveText('Preparing 2 assets as assets.zip')
  await expect(page.getByRole('button', { name: 'Download ZIP' })).toHaveCount(0)
})
