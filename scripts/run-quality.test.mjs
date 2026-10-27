import assert from 'node:assert/strict'
import test from 'node:test'

let qualityModule
try {
  qualityModule = await import('./run-quality.mjs')
} catch {
  qualityModule = {}
}

test('exports the fixed ordered quality gate list and orchestration function', () => {
  assert.equal(typeof qualityModule.runQuality, 'function')
  assert.deepEqual(
    qualityModule.QUALITY_CHECKS?.map((check) => [check.name, check.script]),
    [
      ['Lint', 'lint'],
      ['Production build', 'build'],
      ['Frontend tests', 'test:frontend'],
      ['Tooling contracts', 'test:tooling'],
      ['Browser tests', 'test:browser'],
      ['Requirement traceability', 'test:traceability'],
    ],
  )
})

test('reports every gate as passing when simulated children pass', () => {
  const output = []
  const calledScripts = []
  const status = qualityModule.runQuality?.({
    runChild: (check) => {
      calledScripts.push(check.script)
      return { status: 0 }
    },
    write: (line) => output.push(line),
  })

  assert.equal(status, 0)
  assert.deepEqual(calledScripts, qualityModule.QUALITY_CHECKS.map((check) => check.script))
  for (const check of qualityModule.QUALITY_CHECKS) {
    assert.ok(output.includes(`[quality] START ${check.name}`))
    assert.ok(output.includes(`[quality] PASS ${check.name}`))
  }
  assert.ok(output.includes('[quality] SUMMARY PASS: 6/6 gates passed'))
})

test('continues after one simulated child failure and returns a non-zero status', () => {
  const output = []
  const calledScripts = []
  const status = qualityModule.runQuality?.({
    runChild: (check) => {
      calledScripts.push(check.script)
      return { status: check.script === 'build' ? 2 : 0 }
    },
    write: (line) => output.push(line),
  })

  assert.equal(status, 1)
  assert.deepEqual(calledScripts, qualityModule.QUALITY_CHECKS.map((check) => check.script))
  assert.ok(output.includes('[quality] FAIL Production build (exit code 2)'))
  assert.ok(output.includes('[quality] SUMMARY FAIL: Production build'))
})

test('lists every failed gate after attempting multiple simulated failures', () => {
  const output = []
  const status = qualityModule.runQuality?.({
    runChild: (check) => ({ status: ['lint', 'test:browser'].includes(check.script) ? 1 : 0 }),
    write: (line) => output.push(line),
  })

  assert.equal(status, 1)
  assert.ok(output.includes('[quality] SUMMARY FAIL: Lint, Browser tests'))
})

test('treats simulated process errors and signals as named failures', () => {
  const output = []
  const status = qualityModule.runQuality?.({
    runChild: (check) => {
      if (check.script === 'test:tooling') return { error: new Error('spawn failed') }
      if (check.script === 'test:traceability') return { signal: 'SIGTERM', status: null }
      return { status: 0 }
    },
    write: (line) => output.push(line),
  })

  assert.equal(status, 1)
  assert.ok(output.includes('[quality] FAIL Tooling contracts (process error: spawn failed)'))
  assert.ok(output.includes('[quality] FAIL Requirement traceability (signal: SIGTERM)'))
  assert.ok(output.includes('[quality] SUMMARY FAIL: Tooling contracts, Requirement traceability'))
})
