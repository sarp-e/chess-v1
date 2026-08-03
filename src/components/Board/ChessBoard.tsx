import React, { useState, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import type { SquareHandlerArgs, PieceDropHandlerArgs } from 'react-chessboard'
import { useSettings } from '../../context/SettingsContext'

interface ChessBoardProps {
  fen: string
  onMove: (from: string, to: string) => boolean
  orientation?: 'white' | 'black'
  disabled?: boolean
  lastMove?: { from: string; to: string } | null
}

export default function ChessBoard({
  fen,
  onMove,
  orientation = 'white',
  disabled = false,
  lastMove,
}: ChessBoardProps) {
  const { settings } = useSettings()
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [legalMoveSquares, setLegalMoveSquares] = useState<Record<string, React.CSSProperties>>({})

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
    if (disabled) return
    const game = new Chess(fen)
    const sq = square as Square

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
  }, [disabled, fen, selectedSquare, onMove, getLegalMoves])

  const onPieceDrop = useCallback(({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
    if (disabled || !targetSquare) return false
    setSelectedSquare(null)
    setLegalMoveSquares({})
    return onMove(sourceSquare, targetSquare)
  }, [disabled, onMove])

  const squareStyles: Record<string, React.CSSProperties> = { ...legalMoveSquares }

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

  return (
    <div className="w-full max-w-[min(80vh,100%)] mx-auto">
      <Chessboard
        options={{
          position: fen,
          onPieceDrop,
          onSquareClick,
          boardOrientation: orientation,
          allowDragging: !disabled,
          lightSquareStyle: { backgroundColor: 'var(--board-light)' },
          darkSquareStyle: { backgroundColor: 'var(--board-dark)' },
          squareStyles,
          animationDurationInMs: 150,
        }}
      />
    </div>
  )
}
