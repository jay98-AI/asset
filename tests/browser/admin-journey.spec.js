import { expect, test } from '@playwright/test'

// Each test runs in its own browser context, so every journey starts from the
// seeded in-memory library rather than relying on test order.

async function unlock(page) {
  await page.getByRole('button', { name: 'Admin', exact: true }).click()
  await page.getByLabel('Password').fill('admin123')
  await page.getByRole('button', { name: 'Unlock' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Upload and manage' })).toBeVisible()
}

test('prototype admin publishes, links, versions, and deletes', async ({ page }) => {
  await page.goto('/')

  // Wrong password stays inside the dialog and reports the error.
  await page.getByRole('button', { name: 'Admin', exact: true }).click()
  await page.getByLabel('Password').fill('not-the-password')
  await page.getByRole('button', { name: 'Unlock' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('Incorrect password')).toBeVisible()

  // Cancel returns to member mode.
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Upload', exact: true })).toHaveCount(0)

  await unlock(page)

  // Validation before any field is filled.
  await page.getByRole('button', { name: /Publish asset/ }).click()
  await expect(page.getByRole('status')).toHaveText('Select a project or enter a new project name')

  // Publish a new asset.
  await page.getByLabel(/Project \*/).selectOption('Moonlit Harbor')
  await page.getByLabel(/Asset name/).fill('Journey Asset')
  await page.getByLabel(/Scenes/).fill('ep03 sc09')
  await page.getByRole('button', { name: /Publish asset/ }).click()

  await expect(page.getByRole('status')).toHaveText('Asset published · waiting for review')
  await expect(page.getByRole('button', { name: /Journey Asset/ })).toBeVisible()

  // Link the new asset to a second scene.
  await page.getByRole('button', { name: /Journey Asset/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Journey Asset' })).toBeVisible()

  await page.getByLabel('Target episode').fill('4')
  await page.getByLabel('Target scene').fill('2')
  await page.getByRole('button', { name: 'Link to scene' }).click()
  await expect(page.locator('.used-in')).toContainText('Ep 4 · Sc 2')

  // Cancel a version upload without changing anything.
  await page.getByRole('button', { name: /Add version/ }).click()
  await page.getByRole('button', { name: /Choose a file/ }).click()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.version-badge')).toHaveText('V1 · latest')

  // Upload a real version.
  await page.getByRole('button', { name: /Add version/ }).click()
  await page.getByRole('button', { name: /Choose a file/ }).click()
  await page.getByRole('button', { name: 'Upload V2' }).click()
  await expect(page.locator('.version-badge')).toHaveText('V2 · latest')

  // Destructive action requires confirmation.
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Confirm delete?' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirm delete?' }).click()

  await expect(page.getByRole('status')).toHaveText('Asset deleted')
  await expect(page.getByRole('button', { name: /Journey Asset/ })).toHaveCount(0)
})

test('published changes are in-memory only and vanish on reload', async ({ page }) => {
  await page.goto('/')
  await unlock(page)

  await page.getByLabel(/Project \*/).selectOption('Moonlit Harbor')
  await page.getByLabel(/Asset name/).fill('Ephemeral Asset')
  await page.getByLabel(/Scenes/).fill('ep05 sc01')
  await page.getByRole('button', { name: /Publish asset/ }).click()
  await expect(page.getByRole('button', { name: /Ephemeral Asset/ })).toBeVisible()
  await expect(page.locator('.admin-count')).toContainText('15')

  // The prototype stores everything in React memory.
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Find the right asset, fast.' })).toBeVisible()

  await unlock(page)
  await expect(page.locator('.admin-count')).toContainText('14')
  await expect(page.getByRole('button', { name: /Ephemeral Asset/ })).toHaveCount(0)
})
