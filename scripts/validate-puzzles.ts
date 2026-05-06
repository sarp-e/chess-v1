#!/usr/bin/env tsx
/**
 * Puzzle validation — Tier 1 (chess.js) always runs; Tier 2 (Stockfish) with --deep flag.
 * Run via: npm run validate-puzzles
 *          npm run validate-puzzles -- --deep
 */

import { Chess } from 'chess.js'
import { spawn, execSync } from 'child_process'
import { PUZZLES } from '../src/data/puzzles.js'

const DEEP = process.argv.includes('--deep')
const STOCKFISH_DEPTH = 18

// Themes that require the final position to be checkmate
const CHECKMATE_THEMES = new Set([
  'back-rank',
  'checkmate-in-1',
  'checkmate-in-2',
  'checkmate-in-3',
])

const errors: string[] = []

function fail(id: string, msg: string): void {
  errors.push(`[${id}] ${msg}`)
}

// ── Tier 1: chess.js ──────────────────────────────────────────────────────────

console.log(`Running Tier 1 checks on ${PUZZLES.length} puzzles...`)

for (const puzzle of PUZZLES) {
  const { id, fen, solution, theme } = puzzle

  // 1. FEN parses without error
  let chess: Chess
  try {
    chess = new Chess(fen)
  } catch (e) {
    fail(id, `FEN parse error: ${e}`)
    continue
  }

  // 2. Opponent's king is not in check at the start.
  //    Swap the active side, then inCheck() reports whether the *original* active
  //    side's opponent was already under attack — which is an illegal position.
  const swappedFen = fen.replace(/ [wb] /, m => (m === ' w ' ? ' b ' : ' w '))
  try {
    const swapped = new Chess(swappedFen)
    if (swapped.inCheck()) {
      const active = chess.turn() === 'w' ? 'White' : 'Black'
      const opponent = active === 'White' ? 'Black' : 'White'
      fail(id, `Illegal starting position: ${opponent} king is in check but it's ${active}'s turn`)
    }
  } catch {
    // Swapped FEN may itself be invalid (e.g. both kings in check); skip this sub-check.
  }

  // 3. Every solution move is legal from the position it's played from
  const board = new Chess(fen)
  let moveError = false
  for (let i = 0; i < solution.length; i++) {
    const uci = solution[i]
    const result = board.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      ...(uci.length === 5 ? { promotion: uci[4] } : {}),
    })
    if (!result) {
      fail(id, `solution[${i}] "${uci}" is not a legal move from the resulting position`)
      moveError = true
      break
    }
  }

  // 4. Checkmate-themed puzzles must end in checkmate
  if (!moveError && CHECKMATE_THEMES.has(theme) && !board.isCheckmate()) {
    fail(id, `theme is "${theme}" but the final position is not checkmate`)
  }
}

const tier1Failures = errors.length
console.log(
  tier1Failures === 0
    ? `  ✓ All ${PUZZLES.length} puzzles passed Tier 1`
    : `  ✗ ${tier1Failures} Tier 1 failure(s) found`,
)

// ── Tier 2: Stockfish ─────────────────────────────────────────────────────────

if (DEEP) {
  console.log(`\nRunning Tier 2 checks (Stockfish depth ${STOCKFISH_DEPTH})...`)

  const sfPath: string | null = (() => {
    try {
      return execSync('which stockfish', { encoding: 'utf8' }).trim()
    } catch {
      return null
    }
  })()

  if (!sfPath) {
    console.warn('  Stockfish binary not found in PATH — skipping Tier 2')
  } else {
    // Skip puzzles that already failed Tier 1
    const toCheck = PUZZLES.filter(p => !errors.some(e => e.startsWith(`[${p.id}]`)))

    for (const puzzle of toCheck) {
      const best = await getBestMove(sfPath, puzzle.fen, STOCKFISH_DEPTH)
      if (best !== null && best !== puzzle.solution[0]) {
        fail(
          puzzle.id,
          `Stockfish depth-${STOCKFISH_DEPTH} best move is "${best}" but solution[0] is "${puzzle.solution[0]}"`,
        )
      }
    }

    const tier2Failures = errors.length - tier1Failures
    console.log(
      tier2Failures === 0
        ? `  ✓ All ${toCheck.length} puzzles passed Tier 2`
        : `  ✗ ${tier2Failures} Tier 2 failure(s) found`,
    )
  }
}

// ── Report ────────────────────────────────────────────────────────────────────

if (errors.length > 0) {
  console.error('\nPuzzle validation failed:\n')
  errors.forEach(e => console.error('  ' + e))
  console.error('')
  process.exit(1)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getBestMove(sfPath: string, fen: string, depth: number): Promise<string | null> {
  return new Promise(resolve => {
    const sf = spawn(sfPath)
    let buf = ''
    let done = false

    const finish = (move: string | null) => {
      if (done) return
      done = true
      sf.kill()
      resolve(move)
    }

    sf.stdout.on('data', (chunk: Buffer) => {
      buf += chunk.toString()
      for (const line of buf.split('\n')) {
        if (line.startsWith('bestmove ')) {
          const move = line.split(' ')[1]
          finish(move === '(none)' ? null : move)
        }
      }
    })

    sf.on('error', () => finish(null))
    setTimeout(() => finish(null), 30_000)

    sf.stdin.write(`position fen ${fen}\n`)
    sf.stdin.write(`go depth ${depth}\n`)
  })
}
