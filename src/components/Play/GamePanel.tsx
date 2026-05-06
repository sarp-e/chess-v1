import { useRef, useEffect } from 'react'
import type { GameStatus, CapturedPieces } from '../../hooks/useChessGame'
import type { Bot } from '../../types'
import { formatMoveHistory, getMaterialScore, pieceSymbol } from '../../utils/chess'

interface GamePanelProps {
  status: GameStatus
  moveHistory: string[]
  capturedPieces: CapturedPieces
  selectedBot: Bot
  isGameOver: boolean
  onNewGame: () => void
  onUndo: () => void
  onFlip: () => void
  canUndo: boolean
}

const STATUS_MESSAGES: Record<GameStatus, string> = {
  idle: 'Select a bot and start playing',
  playing: 'Your turn',
  thinking: 'Thinking…',
  checkmate: 'Checkmate!',
  stalemate: 'Stalemate — Draw',
  draw: 'Draw',
}

export default function GamePanel({
  status, moveHistory, capturedPieces, selectedBot, isGameOver,
  onNewGame, onUndo, onFlip, canUndo,
}: GamePanelProps) {
  const moveListRef = useRef<HTMLDivElement>(null)
  const pairs = formatMoveHistory(moveHistory)
  const score = getMaterialScore(capturedPieces.w, capturedPieces.b)

  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight
    }
  }, [moveHistory])

  return (
    <div className="flex flex-col gap-4">
      {/* Bot info */}
      <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
        <span className="text-3xl">{selectedBot.avatar}</span>
        <div>
          <div className="text-white font-medium">{selectedBot.name}</div>
          <div className="text-gray-400 text-xs">ELO {selectedBot.elo}</div>
        </div>
      </div>

      {/* Status */}
      <div className={`rounded-lg p-3 text-center font-medium text-sm ${
        status === 'thinking' ? 'bg-yellow-900/30 text-yellow-400' :
        status === 'checkmate' || status === 'stalemate' || status === 'draw' ? 'bg-blue-900/30 text-blue-400' :
        'bg-gray-800 text-gray-300'
      }`}>
        {STATUS_MESSAGES[status]}
        {status === 'thinking' && (
          <span className="ml-2 inline-flex gap-0.5">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onNewGame}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          New Game
        </button>
        <button
          onClick={onUndo}
          disabled={!canUndo || isGameOver}
          className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          Undo
        </button>
        <button
          onClick={onFlip}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          title="Flip board"
        >
          ⇅
        </button>
      </div>

      {/* Captured pieces */}
      {(capturedPieces.w.length > 0 || capturedPieces.b.length > 0) && (
        <div className="bg-gray-800 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-gray-500 text-xs w-14">You took:</span>
            <span className="text-white text-sm">
              {capturedPieces.w.map(p => pieceSymbol(p)).join(' ')}
            </span>
            {score > 0 && <span className="text-green-400 text-xs ml-auto">+{score}</span>}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-gray-500 text-xs w-14">Bot took:</span>
            <span className="text-white text-sm">
              {capturedPieces.b.map(p => pieceSymbol(p)).join(' ')}
            </span>
            {score < 0 && <span className="text-red-400 text-xs ml-auto">{score}</span>}
          </div>
        </div>
      )}

      {/* Move history */}
      {moveHistory.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-2">Move History</div>
          <div ref={moveListRef} className="max-h-40 overflow-y-auto space-y-0.5">
            {pairs.map(({ moveNumber, white, black }) => (
              <div key={moveNumber} className="flex gap-2 text-sm">
                <span className="text-gray-600 w-6 text-right">{moveNumber}.</span>
                <span className="text-white w-14">{white}</span>
                {black && <span className="text-gray-300">{black}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
