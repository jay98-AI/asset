import { expect, test } from '@playwright/test'

test('renders the Asset Hub search entry point', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Asset Hub')
  await expect(page.getByRole('heading', { level: 1, name: 'Find the right asset, fast.' })).toBeVisible()
})
