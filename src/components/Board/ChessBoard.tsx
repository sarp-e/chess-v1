import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import type { SquareHandlerArgs, PieceDropHandlerArgs, PieceHandlerArgs } from 'react-chessboard'
import { useSettings } from '../../context/SettingsContext'

interface ChessBoardProps {
  fen: string
  onMove: (from: string, to: string) => boolean
  orientation?: 'white' | 'black'
  disabled?: boolean
  lastMove?: { from: string; to: string } | null
  playerColor?: 'w' | 'b'
  hintSquare?: string | null
}

interface QueuedMove {
  from: string
  to: string
}

// Best-effort preview of the board after a chain of queued premoves, so later
// premoves in the queue can be selected against where pieces will *be*, not
// where they are right now. Each step forces the mover's turn (premoves are
// inherently played out of turn) and silently skips a step that turns out
// illegal against the projected position.
// A premove is inherently out of turn — pretend the given color is to move
// so chess.js will compute moves/legality for that piece on this position.
function forceTurn(fen: string, color: 'w' | 'b'): Chess {
  const parts = fen.split(' ')
  parts[1] = color
  return new Chess(parts.join(' '))
}

function projectFen(fen: string, queue: QueuedMove[]): string {
  let current = fen
  for (const { from, to } of queue) {
    const board = new Chess(current)
    const piece = board.get(from as Square)
    if (!piece) continue
    const forced = forceTurn(current, piece.color)
    try {
      if (forced.move({ from, to, promotion: 'q' })) current = forced.fen()
    } catch {
      // illegal against the projected position — skip, keep projecting the rest
    }
  }
  return current
}

export default function ChessBoard({
  fen,
  onMove,
  orientation = 'white',
  disabled = false,
  lastMove,
  playerColor,
  hintSquare,
}: ChessBoardProps) {
  const { settings } = useSettings()
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [legalMoveSquares, setLegalMoveSquares] = useState<Record<string, React.CSSProperties>>({})
  const [premoveQueue, setPremoveQueue] = useState<QueuedMove[]>([])
  const canPremove = settings.allowPremove && !!playerColor

  // Fire the next queued premove once it becomes the player's turn again. `lastMove`
  // is null right after a fresh game starts, which distinguishes "opponent replied"
  // from "the game was reset" — both flip `disabled` true -> false. Only the front
  // of the queue is consumed per turn; the rest wait for the turns after that.
  const wasDisabledRef = useRef(disabled)
  useEffect(() => {
    const wasDisabled = wasDisabledRef.current
    wasDisabledRef.current = disabled
    if (wasDisabled && !disabled && premoveQueue.length > 0) {
      const [next, ...rest] = premoveQueue
      if (lastMove && settings.allowPremove) onMove(next.from, next.to)
      setPremoveQueue(rest)
      setSelectedSquare(null)
      setLegalMoveSquares({})
    }
  }, [disabled, lastMove, premoveQueue, onMove, settings.allowPremove])

  const getLegalMoves = useCallback((square: Square, game: Chess): Record<string, React.CSSProperties> => {
    if (!settings.showLegalMoves) return {}
    const moves = game.moves({ square, verbose: true })
    const squares: Record<string, React.CSSProperties> = {}
    moves.forEach(m => {
      if (typeof m === 'object' && 'to' in m) {
        squares[m.to] = {
          background: game.get(m.to as Square)
            ? 'radial-gradient(circle, var(--board-move-capture) 85%, transparent 85%)'
            : 'radial-gradient(circle, var(--board-move-dot) 25%, transparent 25%)',
          borderRadius: '50%',
        }
      }
    })
    return squares
  }, [settings.showLegalMoves])

  const onSquareClick = useCallback(({ square }: SquareHandlerArgs) => {
    const game = new Chess(fen)
    const sq = square as Square

    if (disabled) {
      if (!canPremove) return
      if (selectedSquare) {
        if (selectedSquare !== square) setPremoveQueue(q => [...q, { from: selectedSquare, to: square }])
        setSelectedSquare(null)
        setLegalMoveSquares({})
        return
      }
      const lastQueued = premoveQueue[premoveQueue.length - 1]
      if (lastQueued && lastQueued.from === square) {
        setPremoveQueue(q => q.slice(0, -1))
        return
      }
      const projectedFen = projectFen(fen, premoveQueue)
      const piece = new Chess(projectedFen).get(sq)
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square)
        setLegalMoveSquares(getLegalMoves(sq, forceTurn(projectedFen, piece.color)))
      }
      return
    }

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null)
        setLegalMoveSquares({})
        return
      }
      const success = onMove(selectedSquare, square)
      setSelectedSquare(null)
      setLegalMoveSquares({})
      if (!success) {
        const piece = game.get(sq)
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square)
          setLegalMoveSquares(getLegalMoves(sq, game))
        }
      }
      return
    }

    const piece = game.get(sq)
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square)
      setLegalMoveSquares(getLegalMoves(sq, game))
    }
  }, [disabled, canPremove, fen, selectedSquare, premoveQueue, playerColor, onMove, getLegalMoves])

  // Mirror the fresh-selection half of onSquareClick when a drag starts, so the
  // legal-move markers show while dragging just as they do on click.
  const onPieceDrag = useCallback(({ square }: PieceHandlerArgs) => {
    if (!square) return
    const sq = square as Square

    if (disabled) {
      if (!canPremove) return
      const projectedFen = projectFen(fen, premoveQueue)
      const piece = new Chess(projectedFen).get(sq)
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square)
        setLegalMoveSquares(getLegalMoves(sq, forceTurn(projectedFen, piece.color)))
      }
      return
    }

    const game = new Chess(fen)
    const piece = game.get(sq)
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square)
      setLegalMoveSquares(getLegalMoves(sq, game))
    }
  }, [disabled, canPremove, fen, premoveQueue, playerColor, getLegalMoves])

  const onPieceDrop = useCallback(({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
    if (!targetSquare) {
      // drag cancelled (dropped off board / on origin) — clear the drag markers
      setSelectedSquare(null)
      setLegalMoveSquares({})
      return false
    }

    if (disabled) {
      if (!canPremove) return false
      const projected = new Chess(projectFen(fen, premoveQueue))
      const piece = projected.get(sourceSquare as Square)
      if (!piece || piece.color !== playerColor) return false
      setPremoveQueue(q => [...q, { from: sourceSquare, to: targetSquare }])
      setSelectedSquare(null)
      setLegalMoveSquares({})
      return false
    }

    setSelectedSquare(null)
    setLegalMoveSquares({})
    return onMove(sourceSquare, targetSquare)
  }, [disabled, canPremove, fen, premoveQueue, playerColor, onMove])

  const squareStyles: Record<string, React.CSSProperties> = settings.showLegalMoves ? { ...legalMoveSquares } : {}

  // Check highlight (king in check)
  const game = new Chess(fen)
  if (game.isCheck()) {
    const turn = game.turn()
    for (const row of game.board()) {
      for (const piece of row) {
        if (piece && piece.type === 'k' && piece.color === turn) {
          squareStyles[piece.square] = { backgroundColor: 'var(--board-check)' }
        }
      }
    }
  }

  if (selectedSquare) {
    squareStyles[selectedSquare] = { backgroundColor: 'var(--board-highlight-selected)' }
  }
  if (lastMove) {
    squareStyles[lastMove.from] = { backgroundColor: 'var(--board-highlight-last)' }
    squareStyles[lastMove.to] = { backgroundColor: 'var(--board-highlight-last)' }
  }
  if (settings.allowPremove) {
    premoveQueue.forEach(({ from, to }) => {
      squareStyles[from] = { backgroundColor: 'var(--warning-soft)' }
      squareStyles[to] = { backgroundColor: 'var(--danger-soft)' }
    })
  }
  if (hintSquare) {
    squareStyles[hintSquare] = { backgroundColor: 'var(--board-hint)' }
  }

  return (
    <div className="w-full max-w-[min(80vh,100%)] mx-auto">
      <Chessboard
        options={{
          position: fen,
          onPieceDrop,
          onPieceDrag,
          onSquareClick,
          boardOrientation: orientation,
          allowDragging: !disabled || canPremove,
          lightSquareStyle: { backgroundColor: 'var(--board-light)' },
          darkSquareStyle: { backgroundColor: 'var(--board-dark)' },
          squareStyles,
          animationDurationInMs: 150,
        }}
      />
    </div>
  )
}
