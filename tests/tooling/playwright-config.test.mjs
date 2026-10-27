import assert from 'node:assert/strict'
import test from 'node:test'
import config from '../../playwright.config.js'

test('uses the fixed local Vite browser-harness contract', () => {
  assert.equal(config.testDir, './tests/browser', 'testDir must target authored browser specs')
  assert.equal(config.use.baseURL, 'http://127.0.0.1:4173', 'baseURL must use the fixed loopback URL')
  assert.equal(
    config.webServer.command,
    'npm run dev -- --host 127.0.0.1 --port 4173',
    'webServer must launch Vite on the fixed loopback host and port',
  )
  assert.equal(config.webServer.url, 'http://127.0.0.1:4173', 'webServer must wait for the fixed loopback URL')
})

test('uses one Chromium project and retains diagnostics only on failure', () => {
  assert.equal(config.projects.length, 1, 'exactly one browser project is required')
  assert.equal(config.projects[0].name, 'chromium', 'the browser project must be Chromium')
  assert.equal(config.use.trace, 'retain-on-failure', 'trace policy must retain failures')
  assert.equal(config.use.screenshot, 'only-on-failure', 'screenshot policy must retain failures only')
  assert.equal(config.use.video, 'retain-on-failure', 'video policy must retain failures')
})

test('uses non-interactive list and HTML reporters', () => {
  const listReporter = config.reporter.find(([name]) => name === 'list')
  const htmlReporter = config.reporter.find(([name]) => name === 'html')

  assert.ok(listReporter, 'list reporter must be configured')
  assert.ok(htmlReporter, 'HTML reporter must be configured')
  assert.equal(htmlReporter[1].open, 'never', 'HTML report must not open interactively')
  assert.equal(htmlReporter[1].outputFolder, 'playwright-report', 'HTML report location must remain stable')
})
