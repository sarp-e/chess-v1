import { useRef, useEffect, useState } from 'react'
import type { GameStatus, CapturedPieces } from '../../hooks/useChessGame'
import type { Bot, AssistLevel } from '../../types'
import { formatMoveHistory, getMaterialScore, pieceSymbol } from '../../utils/chess'

type HintState = 'none' | 'loading' | 'ready'

interface GamePanelProps {
  status: GameStatus
  moveHistory: string[]
  capturedPieces: CapturedPieces
  selectedBot: Bot
  isGameOver: boolean
  onNewGame: () => void
  onUndo: () => void
  onFlip: () => void
  onResign: () => void
  canUndo: boolean
  assistLevel: AssistLevel
  hintState: HintState
  onShowHint: () => void
  onShowAnswer: () => void
  canHint: boolean
}

const STATUS_MESSAGES: Record<GameStatus, string> = {
  idle: 'Select a bot and start playing',
  playing: 'Your turn',
  thinking: 'Thinking…',
  checkmate: 'Checkmate!',
  stalemate: 'Stalemate — Draw',
  draw: 'Draw',
  resigned: 'You resigned',
}

export default function GamePanel({
  status, moveHistory, capturedPieces, selectedBot, isGameOver,
  onNewGame, onUndo, onFlip, onResign, canUndo,
  assistLevel, hintState, onShowHint, onShowAnswer, canHint,
}: GamePanelProps) {
  const assisted = assistLevel === 'assisted'
  const moveListRef = useRef<HTMLDivElement>(null)
  const [resignConfirming, setResignConfirming] = useState(false)
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
      <div className="bg-[var(--panel-alt)] rounded-lg p-3 flex items-center gap-3">
        <span className="text-3xl">{selectedBot.avatar}</span>
        <div>
          <div className="text-[var(--text-primary)] font-medium">{selectedBot.name}</div>
          <div className="text-[var(--text-muted)] text-xs">ELO {selectedBot.elo}</div>
        </div>
      </div>

      {/* Status */}
      <div className={`rounded-lg p-3 text-center font-medium text-sm ${
        status === 'thinking' ? 'bg-[var(--warning-soft)] text-[var(--warning)]' :
        status === 'checkmate' || status === 'stalemate' || status === 'draw' || status === 'resigned'
          ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
          : 'bg-[var(--panel-alt)] text-[var(--text-secondary)]'
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
          className="flex-1 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-lg transition-colors"
        >
          New Game
        </button>
        {assisted && (
          <button
            onClick={onUndo}
            disabled={!canUndo || isGameOver}
            className="flex-1 py-2 bg-[var(--panel-alt)] hover:bg-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-primary)] text-sm font-medium rounded-lg transition-colors"
          >
            Undo
          </button>
        )}
        <button
          onClick={onFlip}
          className="px-3 py-2 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--text-primary)] text-sm rounded-lg transition-colors"
          title="Flip board"
        >
          ⇅
        </button>
      </div>

      {/* Hint (assisted play only) */}
      {assisted && (
        hintState === 'ready' ? (
          <button
            onClick={onShowAnswer}
            className="w-full py-2 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--text-secondary)] text-sm rounded-lg transition-colors"
          >
            Show Answer
          </button>
        ) : (
          <button
            onClick={onShowHint}
            disabled={!canHint || hintState === 'loading'}
            className="w-full py-2 bg-[var(--panel-alt)] hover:bg-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-secondary)] text-sm rounded-lg transition-colors"
          >
            {hintState === 'loading' ? 'Thinking…' : 'Show Hint'}
          </button>
        )
      )}

      {/* Resign */}
      {status === 'playing' && (
        resignConfirming ? (
          <div className="bg-[var(--panel-alt)] rounded-lg p-3 space-y-2">
            <p className="text-[var(--text-primary)] text-sm text-center">Are you sure you want to resign?</p>
            <div className="flex gap-2">
              <button
                onClick={() => { onResign(); setResignConfirming(false) }}
                className="flex-1 py-1.5 bg-[var(--danger)] hover:opacity-90 text-white text-sm rounded-lg transition-colors"
              >
                Yes, resign
              </button>
              <button
                onClick={() => setResignConfirming(false)}
                className="flex-1 py-1.5 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--text-secondary)] text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setResignConfirming(true)}
            className="w-full py-2 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--danger)] text-sm font-medium rounded-lg transition-colors"
          >
            Resign
          </button>
        )
      )}

      {/* Captured pieces */}
      {(capturedPieces.w.length > 0 || capturedPieces.b.length > 0) && (
        <div className="bg-[var(--panel-alt)] rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[var(--text-muted)] text-xs w-14">You took:</span>
            <span className="text-[var(--text-primary)] text-sm">
              {capturedPieces.w.map(p => pieceSymbol(p)).join(' ')}
            </span>
            {score > 0 && <span className="text-[var(--success)] text-xs ml-auto">+{score}</span>}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[var(--text-muted)] text-xs w-14">Bot took:</span>
            <span className="text-[var(--text-primary)] text-sm">
              {capturedPieces.b.map(p => pieceSymbol(p)).join(' ')}
            </span>
            {score < 0 && <span className="text-[var(--danger)] text-xs ml-auto">{score}</span>}
          </div>
        </div>
      )}

      {/* Move history */}
      {moveHistory.length > 0 && (
        <div className="bg-[var(--panel-alt)] rounded-lg p-3">
          <div className="text-[var(--text-muted)] text-xs mb-2">Move History</div>
          <div ref={moveListRef} className="max-h-40 overflow-y-auto space-y-0.5">
            {pairs.map(({ moveNumber, white, black }) => (
              <div key={moveNumber} className="flex gap-2 text-sm">
                <span className="text-[var(--text-muted)] w-6 text-right">{moveNumber}.</span>
                <span className="text-[var(--text-primary)] w-14">{white}</span>
                {black && <span className="text-[var(--text-secondary)]">{black}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
