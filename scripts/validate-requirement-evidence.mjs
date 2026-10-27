import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

export const EXPECTED_REQUIREMENT_IDS = [
  'QA-01', 'QA-02', 'QA-03', 'FUNC-01', 'FUNC-02', 'FUNC-03', 'FUNC-04',
  'RESP-01', 'RESP-02', 'RESP-03', 'UX-01', 'UX-02', 'UX-03', 'UX-04',
  'REP-01', 'REP-02', 'FIX-01', 'FIX-02', 'FIX-03',
]

const TABLE_COLUMNS = [
  'Requirement', 'Description', 'Phase', 'Check Type', 'Status', 'Named Check', 'Evidence',
]
const REQUIRED_FIELDS = [
  ['requirement', 'requirement'],
  ['description', 'description'],
  ['phase', 'phase'],
  ['checkType', 'check type'],
  ['status', 'status'],
  ['namedCheck', 'named check'],
  ['evidence', 'evidence'],
]
const ALLOWED_CHECK_TYPES = new Set(['automated', 'manual', 'automated + manual'])
const ALLOWED_STATUSES = new Set(['implemented', 'planned'])

function tableCells(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
}

function isSeparator(cells) {
  return cells.length === TABLE_COLUMNS.length && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

export function parseEvidenceTable(markdown) {
  if (typeof markdown !== 'string') return []

  const lines = markdown.split(/\r?\n/)
  const headerIndex = lines.findIndex((line) => {
    const cells = tableCells(line)
    return cells.length === TABLE_COLUMNS.length && cells.every((cell, index) => cell === TABLE_COLUMNS[index])
  })

  if (headerIndex < 0 || !isSeparator(tableCells(lines[headerIndex + 1] ?? ''))) return []

  const rows = []
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trim().startsWith('|')) break
    const cells = tableCells(line)
    if (cells.length !== TABLE_COLUMNS.length) continue
    rows.push({
      requirement: cells[0],
      description: cells[1],
      phase: cells[2],
      checkType: cells[3],
      status: cells[4],
      namedCheck: cells[5],
      evidence: cells[6],
    })
  }
  return rows
}

export function validateEvidenceRows(rows) {
  const expectedIds = new Set(EXPECTED_REQUIREMENT_IDS)
  const problems = []
  const seenIds = new Set()

  if (!Array.isArray(rows)) {
    return {
      valid: false,
      coverage: `0/${EXPECTED_REQUIREMENT_IDS.length}`,
      problems: ['Rows are required and must be an array.'],
      missingIds: [...EXPECTED_REQUIREMENT_IDS],
    }
  }

  rows.forEach((row, index) => {
    const location = `row ${index + 1}`
    const id = typeof row?.requirement === 'string' ? row.requirement.trim() : ''
    const label = id || location

    for (const [field, name] of REQUIRED_FIELDS) {
      if (typeof row?.[field] !== 'string' || row[field].trim() === '') {
        problems.push(`${label}: missing ${name}.`)
      }
    }

    if (id && !expectedIds.has(id)) problems.push(`Unknown requirement ID: ${id}.`)
    if (id && seenIds.has(id)) problems.push(`Duplicate requirement ID: ${id}.`)
    if (id) seenIds.add(id)

    if (typeof row?.checkType === 'string' && row.checkType.trim() && !ALLOWED_CHECK_TYPES.has(row.checkType.trim())) {
      problems.push(`${label}: unsupported check type "${row.checkType.trim()}".`)
    }
    if (typeof row?.status === 'string' && row.status.trim() && !ALLOWED_STATUSES.has(row.status.trim())) {
      problems.push(`${label}: unsupported status "${row.status.trim()}".`)
    }
  })

  const observedIds = EXPECTED_REQUIREMENT_IDS.filter((id) => seenIds.has(id))
  const missingIds = EXPECTED_REQUIREMENT_IDS.filter((id) => !seenIds.has(id))
  if (missingIds.length) problems.push(`Missing requirement IDs: ${missingIds.join(', ')}.`)

  return {
    valid: problems.length === 0,
    coverage: `${observedIds.length}/${EXPECTED_REQUIREMENT_IDS.length}`,
    problems,
    missingIds,
  }
}

async function runCli() {
  const inputPath = process.argv[2] ?? 'docs/quality/requirement-evidence.md'
  let markdown

  try {
    markdown = await readFile(inputPath, 'utf8')
  } catch (error) {
    console.error(`Requirement evidence validation: unable to read ${inputPath}: ${error.message}`)
    process.exitCode = 1
    return
  }

  const result = validateEvidenceRows(parseEvidenceTable(markdown))
  console.log(`Requirement evidence validation: ${result.coverage} coverage`)
  if (result.valid) {
    console.log('PASS: exact requirement evidence map is valid.')
    return
  }

  for (const problem of result.problems) console.error(`ERROR: ${problem}`)
  process.exitCode = 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) runCli()
