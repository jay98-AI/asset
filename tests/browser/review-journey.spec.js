import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// Temporary prototype gate: reuse the existing value without copying it into another file.
// Replace this helper when individual server accounts are implemented.
const prototypePassword = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8').match(/password !== '([^']+)'/)?.[1]

test.beforeEach(async ({ page }) => {
  // Verify the prototype works with font fallbacks on an offline office network.
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort())
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort())
})

async function enterSuper(page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Super', exact: true }).click()
  await page.getByLabel('Password', { exact: true }).fill(prototypePassword)
  await page.getByRole('button', { name: 'Unlock', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Waiting for review' })).toBeVisible()
}

async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}

for (const width of [1440, 1280]) {
  test(`review screens fit at ${width}px and rejection requires a note`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 })
    await enterSuper(page)
    await noOverflow(page)
    await page.screenshot({ path: `test-results/review-queue-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: /Arjun – Character Sheet Moonlit Harbor/ }).click()
    await expect(page.getByText('✓ Last approved · V1')).toBeVisible()
    await expect(page.getByText('↑ New version · V4')).toBeVisible()
    await noOverflow(page)
    await page.screenshot({ path: `test-results/review-compare-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: '× Not approved', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Send note' })).toBeDisabled()
    await page.getByLabel(/What needs to be corrected/).fill('Match the approved palette and fix the lantern hand.')
    await expect(page.getByRole('button', { name: 'Send note' })).toBeEnabled()
    await noOverflow(page)
    await page.screenshot({ path: `test-results/review-dialog-${width}.png` })
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Not approved' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '× Not approved', exact: true })).toBeFocused()
  })
}

test('decision, notification, correction round, reply, and approval update member visibility', async ({ page }) => {
  await enterSuper(page)
  await page.getByRole('button', { name: /Arjun – Character Sheet Moonlit Harbor/ }).click()
  await page.getByRole('button', { name: '× Not approved', exact: true }).click()
  await page.getByLabel(/What needs to be corrected/).fill('Please fix the lantern hand.')
  await page.getByRole('button', { name: 'Send note' }).click()
  await expect(page.getByRole('status')).toContainText('Note sent to Riya')
  await page.getByRole('button', { name: 'Admin', exact: true }).click()
  await page.getByRole('button', { name: /Notifications, 3 unread/ }).click()
  await page.getByRole('button', { name: /Dev marked Arjun – Character Sheet version 4 not approved/ }).click()
  await expect(page.getByText('Please fix the lantern hand.')).toBeVisible()
  await page.getByLabel('Reply to thread').fill('The corrected turnaround is ready.')
  await page.getByRole('button', { name: 'Send reply' }).click()
  await expect(page.getByText('The corrected turnaround is ready.')).toBeVisible()
  await page.getByRole('button', { name: '↑ Upload corrected version' }).click()
  await page.getByRole('button', { name: 'Choose a file' }).click()
  await page.getByRole('button', { name: 'Upload V5' }).click()
  await expect(page.getByRole('region', { name: 'Round 4' })).toBeVisible()
  await page.getByRole('button', { name: 'Member', exact: true }).click()
  await page.getByRole('button', { name: 'Open Arjun – Character Sheet', exact: true }).click()
  await expect(page.getByRole('button', { name: /Download V1/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'V5', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Super', exact: true }).click()
  await page.getByLabel('Password', { exact: true }).fill(prototypePassword)
  await page.getByRole('button', { name: 'Unlock', exact: true }).click()
  await page.getByRole('button', { name: /Arjun – Character Sheet Moonlit Harbor/ }).click()
  await page.getByRole('button', { name: '✓ Approve', exact: true }).click()
  await page.getByRole('button', { name: 'Member', exact: true }).click()
  await page.getByRole('button', { name: 'Open Arjun – Character Sheet', exact: true }).click()
  await expect(page.getByRole('button', { name: /Download V5/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'V2', exact: true })).toHaveCount(0)
  await expect(page.getByRole('region', { name: /Review thread/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Notifications/ })).toHaveCount(0)
})

test('super-admin upload records automatic approval and appears for members', async ({ page }) => {
  await enterSuper(page)
  await page.getByRole('button', { name: 'Upload', exact: true }).click()
  await page.getByLabel(/Project \*/).selectOption('Moonlit Harbor')
  await page.getByLabel(/Asset name \*/).fill('Super approved demonstration')
  await page.getByLabel(/Scenes \*/).fill('ep01 sc03')
  await page.getByRole('button', { name: /Publish asset/ }).click()
  await page.getByRole('button', { name: /Super approved demonstration/ }).click()
  await expect(page.getByText('Automatically approved: uploaded by a super admin.')).toBeVisible()
  await page.getByRole('button', { name: 'Member', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Open Super approved demonstration' })).toBeVisible()
})
