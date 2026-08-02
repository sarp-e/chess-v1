import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'

export type MoveClass = 'best' | 'inaccuracy' | 'mistake' | 'blunder'

export interface ReviewMove {
  san: string
  uci: string
  color: 'w' | 'b'
  classification: MoveClass | null
  evalBefore: number | null
  evalAfter: number | null
}

export interface GameReviewState {
  fens: string[]
  sans: string[]
  moves: ReviewMove[]
  evals: (number | null)[]
  currentIndex: number
  evaluating: boolean
  progress: number
  goTo: (index: number) => void
  prev: () => void
  next: () => void
}

function parseScore(line: string): number | null {
  const mate = line.match(/score mate (-?\d+)/)
  if (mate) return parseInt(mate[1]) > 0 ? 9900 : -9900
  const cp = line.match(/score cp (-?\d+)/)
  if (cp) return parseInt(cp[1])
  return null
}

function classify(loss: number): MoveClass {
  if (loss > 200) return 'blunder'
  if (loss > 100) return 'mistake'
  if (loss > 50) return 'inaccuracy'
  return 'best'
}

export function useGameReview(uciMoves: string[]): GameReviewState {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [evals, setEvals] = useState<(number | null)[]>([])
  const [evaluating, setEvaluating] = useState(true)
  const [progress, setProgress] = useState(0)

  // Build FEN list and SAN list once (stable across re-renders)
  const builtRef = useRef<{ fens: string[]; sans: string[]; moveColors: ('w' | 'b')[] } | null>(null)
  if (!builtRef.current) {
    const chess = new Chess()
    const fenList: string[] = [chess.fen()]
    const sanList: string[] = []
    const colors: ('w' | 'b')[] = []
    for (const uci of uciMoves) {
      const from = uci.slice(0, 2)
      const to = uci.slice(2, 4)
      const promotion = uci.length > 4 ? uci[4] : undefined
      try {
        const move = chess.move({ from, to, promotion })
        if (!move) break
        sanList.push(move.san)
        colors.push(move.color)
        fenList.push(chess.fen())
      } catch {
        break
      }
    }
    builtRef.current = { fens: fenList, sans: sanList, moveColors: colors }
  }
  const { fens, sans, moveColors } = builtRef.current

  // Sequential Stockfish evaluation
  useEffect(() => {
    if (fens.length === 0) return

    setEvals(new Array(fens.length).fill(null))

    const worker = new Worker('/stockfish.js')
    let pendingIdx = 0
    let currentScore: number | null = null

    worker.onmessage = (e: MessageEvent) => {
      const line: string = typeof e.data === 'string' ? e.data : String(e.data)

      const score = parseScore(line)
      if (score !== null) currentScore = score

      if (line.startsWith('bestmove')) {
        const captured = currentScore
        setEvals(prev => {
          const next = [...prev]
          next[pendingIdx] = captured
          return next
        })
        pendingIdx++
        currentScore = null

        if (pendingIdx < fens.length) {
          setProgress(Math.round((pendingIdx / fens.length) * 100))
          worker.postMessage(`position fen ${fens[pendingIdx]}`)
          worker.postMessage('go depth 14')
        } else {
          setEvaluating(false)
          setProgress(100)
        }
      }
    }

    worker.postMessage('uci')
    worker.postMessage('isready')
    // Small delay so isready can process before we start sending positions
    setTimeout(() => {
      worker.postMessage(`position fen ${fens[0]}`)
      worker.postMessage('go depth 14')
    }, 300)

    return () => worker.terminate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const moves: ReviewMove[] = sans.map((san: string, i: number) => {
    const evalBefore = evals[i] ?? null
    const evalAfter = evals[i + 1] ?? null
    const color = moveColors[i]

    let classification: MoveClass | null = null
    if (evalBefore !== null && evalAfter !== null) {
      // Loss from the mover's perspective
      const loss = color === 'w'
        ? evalBefore - evalAfter
        : evalAfter - evalBefore
      if (loss > 0) {
        classification = classify(loss)
      } else {
        classification = 'best'
      }
    }

    return { san, uci: uciMoves[i], color, classification, evalBefore, evalAfter }
  })

  const goTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(fens.length - 1, index)))
  }, [fens.length])

  const prev = useCallback(() => setCurrentIndex(i => Math.max(0, i - 1)), [])
  const next = useCallback(() => setCurrentIndex(i => Math.min(fens.length - 1, i + 1)), [fens.length])

  return {
    fens,
    sans,
    moves,
    evals,
    currentIndex,
    evaluating,
    progress,
    goTo,
    prev,
    next,
  }
}
