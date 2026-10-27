import assert from 'node:assert/strict'
import test from 'node:test'

import {
  EXPECTED_REQUIREMENT_IDS,
  parseEvidenceTable,
  validateEvidenceRows,
} from './validate-requirement-evidence.mjs'

const EXPECTED_IDS = [
  'QA-01', 'QA-02', 'QA-03', 'FUNC-01', 'FUNC-02', 'FUNC-03', 'FUNC-04',
  'RESP-01', 'RESP-02', 'RESP-03', 'UX-01', 'UX-02', 'UX-03', 'UX-04',
  'REP-01', 'REP-02', 'FIX-01', 'FIX-02', 'FIX-03',
]

const rowFor = (id) => ({
  requirement: id,
  description: `Description for ${id}`,
  phase: id.startsWith('QA') ? 'Phase 1' : 'Phase 2',
  checkType: 'automated',
  status: 'planned',
  namedCheck: `QC-${id}`,
  evidence: `tests/${id}.test.mjs`,
})

const validRows = () => EXPECTED_IDS.map(rowFor)

test('exports the exact ordered v1 requirement IDs', () => {
  assert.deepEqual(EXPECTED_REQUIREMENT_IDS, EXPECTED_IDS)
})

test('rejects null row input with a rows-required diagnostic', () => {
  const result = validateEvidenceRows(null)

  assert.equal(result.valid, false)
  assert.match(result.problems.join('\n'), /rows are required/i)
})

test('reports 0/19 and every missing ID for an empty map', () => {
  const result = validateEvidenceRows([])

  assert.equal(result.coverage, '0/19')
  assert.deepEqual(result.missingIds, EXPECTED_IDS)
})

test('reports 1/19 and remaining IDs for a singleton map', () => {
  const result = validateEvidenceRows([rowFor('QA-01')])

  assert.equal(result.coverage, '1/19')
  assert.deepEqual(result.missingIds, EXPECTED_IDS.slice(1))
})

test('names affected IDs for blank, absent, and null evidence', () => {
  const rows = validRows()
  rows[0].evidence = ''
  delete rows[1].evidence
  rows[2].evidence = null

  const result = validateEvidenceRows(rows)

  assert.equal(result.valid, false)
  for (const id of ['QA-01', 'QA-02', 'QA-03']) {
    assert.match(result.problems.join('\n'), new RegExp(`${id}.*evidence`, 'i'))
  }
})

test('rejects duplicate and unknown requirement IDs without reducing diagnostics', () => {
  const rows = validRows()
  rows[1].requirement = 'QA-01'
  rows[2].requirement = 'UNKNOWN-99'

  const result = validateEvidenceRows(rows)

  assert.equal(result.valid, false)
  assert.match(result.problems.join('\n'), /duplicate.*QA-01/i)
  assert.match(result.problems.join('\n'), /unknown.*UNKNOWN-99/i)
})

test('rejects unsupported types, statuses, and missing required cells', () => {
  const rows = validRows()
  rows[0].checkType = 'browser tracer'
  rows[1].status = 'complete'
  rows[2].namedCheck = ' '

  const result = validateEvidenceRows(rows)

  assert.equal(result.valid, false)
  assert.match(result.problems.join('\n'), /QA-01.*check type/i)
  assert.match(result.problems.join('\n'), /QA-02.*status/i)
  assert.match(result.problems.join('\n'), /QA-03.*named check/i)
})

test('accepts a complete valid map in authored and reverse order', () => {
  const rows = validRows()

  assert.deepEqual(validateEvidenceRows(rows), { valid: true, coverage: '19/19', problems: [], missingIds: [] })
  assert.deepEqual(validateEvidenceRows([...rows].reverse()), { valid: true, coverage: '19/19', problems: [], missingIds: [] })
})

test('parses only the documented seven Markdown table columns', () => {
  const markdown = [
    '| Requirement | Description | Phase | Check Type | Status | Named Check | Evidence |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    '| QA-01 | Full description | Phase 1 | automated | implemented | QC-01 | `npm run lint` |',
  ].join('\n')

  assert.deepEqual(parseEvidenceTable(markdown), [{
    requirement: 'QA-01',
    description: 'Full description',
    phase: 'Phase 1',
    checkType: 'automated',
    status: 'implemented',
    namedCheck: 'QC-01',
    evidence: '`npm run lint`',
  }])
})
