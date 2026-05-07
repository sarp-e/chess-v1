import { useState, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'

export type GameStatus = 'idle' | 'playing' | 'thinking' | 'checkmate' | 'stalemate' | 'draw'

export interface CapturedPieces {
  w: string[]
  b: string[]
}

export function useChessGame() {
  const [game, setGame] = useState(new Chess())
  const [status, setStatus] = useState<GameStatus>('idle')
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [capturedPieces, setCapturedPieces] = useState<CapturedPieces>({ w: [], b: [] })
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const gameRef = useRef(game)
  gameRef.current = game

  const updateGameState = useCallback((newGame: Chess) => {
    setGame(new Chess(newGame.fen()))
    setMoveHistory(newGame.history())

    // Calculate captured pieces
    const history = newGame.history({ verbose: true })
    const captured: CapturedPieces = { w: [], b: [] }
    history.forEach(move => {
      if (move.captured) {
        // Captured by the mover — captured piece belongs to opponent
        const capturedBy = move.color as 'w' | 'b'
        captured[capturedBy].push(move.captured)
      }
    })
    setCapturedPieces(captured)

    if (history.length > 0) {
      const last = history[history.length - 1]
      setLastMove({ from: last.from, to: last.to })
    } else {
      setLastMove(null)
    }

    if (newGame.isCheckmate()) {
      setStatus('checkmate')
    } else if (newGame.isStalemate()) {
      setStatus('stalemate')
    } else if (newGame.isDraw()) {
      setStatus('draw')
    }
  }, [])

  const makeMove = useCallback((from: string, to: string, promotion = 'q'): boolean => {
    const newGame = new Chess(gameRef.current.fen())
    try {
      const result = newGame.move({ from, to, promotion })
      if (!result) return false
      updateGameState(newGame)
      return true
    } catch {
      return false
    }
  }, [updateGameState])

  const makeMoveFromUCI = useCallback((uci: string): boolean => {
    const from = uci.slice(0, 2)
    const to = uci.slice(2, 4)
    const promotion = uci.length > 4 ? uci[4] : 'q'
    return makeMove(from, to, promotion)
  }, [makeMove])

  const newGame = useCallback(() => {
    const fresh = new Chess()
    setGame(fresh)
    setStatus('playing')
    setMoveHistory([])
    setCapturedPieces({ w: [], b: [] })
    setLastMove(null)
  }, [])

  const undoMove = useCallback(() => {
    const newG = new Chess(gameRef.current.fen())
    newG.undo()
    newG.undo()
    updateGameState(newG)
    setStatus('playing')
  }, [updateGameState])

  const setThinking = useCallback((val: boolean) => {
    setStatus(prev => {
      if (val) return 'thinking'
      if (prev === 'thinking') return 'playing'
      return prev
    })
  }, [])

  return {
    game,
    status,
    moveHistory,
    capturedPieces,
    lastMove,
    makeMove,
    makeMoveFromUCI,
    newGame,
    undoMove,
    setThinking,
    fen: game.fen(),
    turn: game.turn(),
    isGameOver: ['checkmate', 'stalemate', 'draw'].includes(status),
  }
}
