import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const QUALITY_CHECKS = [
  { name: 'Lint', script: 'lint' },
  { name: 'Production build', script: 'build' },
  { name: 'Frontend tests', script: 'test:frontend' },
  { name: 'Tooling contracts', script: 'test:tooling' },
  { name: 'Browser tests', script: 'test:browser' },
  { name: 'Requirement traceability', script: 'test:traceability' },
]

const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function runChildProcess(check) {
  return spawnSync(npmExecutable, ['run', check.script], {
    shell: false,
    stdio: 'inherit',
  })
}

function failureReason(result) {
  if (result?.error) return `process error: ${result.error.message}`
  if (result?.signal) return `signal: ${result.signal}`
  return `exit code ${result?.status ?? 'unknown'}`
}

export function runQuality({ runChild = runChildProcess, write = console.log } = {}) {
  const failedChecks = []

  for (const check of QUALITY_CHECKS) {
    write(`[quality] START ${check.name}`)
    const result = runChild(check)

    if (result?.status === 0 && !result.error && !result.signal) {
      write(`[quality] PASS ${check.name}`)
      continue
    }

    failedChecks.push(check.name)
    write(`[quality] FAIL ${check.name} (${failureReason(result)})`)
  }

  if (failedChecks.length === 0) {
    write(`[quality] SUMMARY PASS: ${QUALITY_CHECKS.length}/${QUALITY_CHECKS.length} gates passed`)
    return 0
  }

  write(`[quality] SUMMARY FAIL: ${failedChecks.join(', ')}`)
  return 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = runQuality()
}
