import { expect, test } from '@playwright/test'

const viewports = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1440, height: 900 },
}

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(metrics.scrollWidth, 'document must not scroll horizontally').toBeLessThanOrEqual(metrics.innerWidth)
}

async function unlock(page) {
  await page.getByRole('button', { name: 'Admin', exact: true }).click()
  await page.getByLabel('Password').fill('admin123')
  await page.getByRole('button', { name: 'Unlock' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Upload and manage' })).toBeVisible()
}

// Finding F-RESP-01: below 720px the CSS hides .tree, so episode and scene
// navigation is unavailable on phones. This spec therefore only asserts what must
// always hold (no overflow, project select operable) and leaves the missing
// navigation to the findings report and Phase 5.
const hasEpisodeTree = (width) => width > 720

for (const [label, viewport] of Object.entries(viewports)) {
  test.describe(`${label} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport })

    test('member search stays usable', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1, name: 'Find the right asset, fast.' })).toBeVisible()
      await expectNoHorizontalOverflow(page)

      // Usable, not merely present: typing still narrows the grid.
      await page.getByPlaceholder('Try: Arjun, ep01, sc03').fill('ep01')
      await expect(page.getByText('9 assets')).toBeVisible()
      await expectNoHorizontalOverflow(page)
    })

    test('member browse drills into an episode', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: 'Browse', exact: true }).click()
      await expect(page.getByRole('heading', { level: 1, name: 'Episode assets' })).toBeVisible()
      await expectNoHorizontalOverflow(page)

      if (hasEpisodeTree(viewport.width)) {
        await page.getByRole('button', { name: /Episode 02/ }).click()
        await expect(page.getByText('7 assets')).toBeVisible()
        await expectNoHorizontalOverflow(page)
      } else {
        // The project picker is the only browse control that survives on phones.
        // F-A11Y-01 gave it an accessible name, so it is reached by role and name.
        await page.getByRole('combobox', { name: 'Project' }).selectOption('Neon Monsoon')
        await expect(page.getByText('2 assets')).toBeVisible()
        await expectNoHorizontalOverflow(page)
      }
    })

    test('member detail switches versions', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: 'Open Arjun – Character Sheet' }).click()
      await expect(page.getByRole('heading', { level: 1, name: 'Arjun – Character Sheet' })).toBeVisible()
      await expectNoHorizontalOverflow(page)

      await page.getByRole('button', { name: 'V2' }).click()
      await expect(page.locator('.version-badge')).toHaveText('V2')
      await expectNoHorizontalOverflow(page)
    })

    test('admin publish is reachable', async ({ page }) => {
      await page.goto('/')
      await unlock(page)
      await expectNoHorizontalOverflow(page)

      // Reaching the publish action proves the mobile admin form is operable.
      await page.getByRole('button', { name: /Publish asset/ }).click()
      await expect(page.getByRole('status')).toHaveText('Select a project or enter a new project name')
      await expectNoHorizontalOverflow(page)
    })
  })
}
