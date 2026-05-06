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

const BOARD_THEMES = {
  classic: { light: '#f0d9b5', dark: '#b58863' },
  wood: { light: '#e8c99a', dark: '#9c6f3a' },
  tournament: { light: '#eeeed2', dark: '#769656' },
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

  const theme = BOARD_THEMES[settings.boardTheme]

  const getLegalMoves = useCallback((square: Square, game: Chess): Record<string, React.CSSProperties> => {
    if (!settings.showLegalMoves) return {}
    const moves = game.moves({ square, verbose: true })
    const squares: Record<string, React.CSSProperties> = {}
    moves.forEach(m => {
      if (typeof m === 'object' && 'to' in m) {
        squares[m.to] = {
          background: game.get(m.to as Square)
            ? 'radial-gradient(circle, rgba(0,0,0,0.15) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(0,0,0,0.15) 25%, transparent 25%)',
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
  if (selectedSquare) {
    squareStyles[selectedSquare] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
  }
  if (lastMove) {
    squareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.2)' }
    squareStyles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.2)' }
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
          lightSquareStyle: { backgroundColor: theme.light },
          darkSquareStyle: { backgroundColor: theme.dark },
          squareStyles,
          animationDurationInMs: 150,
        }}
      />
    </div>
  )
}
