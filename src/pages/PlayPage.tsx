import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chess } from 'chess.js'
import { BOTS } from '../data/bots'
import type { Bot } from '../types'
import ChessBoard from '../components/Board/ChessBoard'
import GamePanel from '../components/Play/GamePanel'
import BotSelector from '../components/Play/BotSelector'
import { useChessGame } from '../hooks/useChessGame'
import { useStockfish } from '../hooks/useStockfish'

export default function PlayPage() {
  const navigate = useNavigate()
  const [selectedBot, setSelectedBot] = useState<Bot>(BOTS[2]) // Coach Remy default
  const [pendingBot, setPendingBot] = useState<Bot>(BOTS[2])
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')
  const [showBotSelect, setShowBotSelect] = useState(true)

  const {
    status, moveHistory, capturedPieces, lastMove,
    makeMove, makeMoveFromUCI, newGame, undoMove, resign, setThinking,
    fen, turn, isGameOver,
  } = useChessGame()

  const handleBestMove = useCallback((uci: string) => {
    setTimeout(() => {
      makeMoveFromUCI(uci)
      setThinking(false)
    }, 400)
  }, [makeMoveFromUCI, setThinking])

  const { findBestMove } = useStockfish({
    depth: selectedBot.depth,
    onBestMove: handleBestMove,
  })

  useEffect(() => {
    if (status === 'playing' && turn === 'b' && !isGameOver) {
      setThinking(true)
      const blunder = Math.random() < selectedBot.blunderChance
      setTimeout(() => {
        findBestMove(fen, blunder ? Math.max(1, selectedBot.depth - 3) : selectedBot.depth)
      }, 300)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, status, turn, isGameOver])

  const handleMove = useCallback((from: string, to: string): boolean => {
    if (turn !== 'w' || status !== 'playing') return false
    return makeMove(from, to)
  }, [turn, status, makeMove])

  const handleNewGame = useCallback(() => {
    setSelectedBot(pendingBot)
    setShowBotSelect(false)
    newGame()
  }, [pendingBot, newGame])

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 min-h-[calc(100vh-56px)]">
      {/* Board */}
      <div className="flex-1 flex items-center justify-center">
        <ChessBoard
          fen={fen}
          onMove={handleMove}
          orientation={orientation}
          disabled={turn !== 'w' || status !== 'playing'}
          lastMove={lastMove}
          playerColor="w"
        />
      </div>

      {/* Panel */}
      <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-4">
        {showBotSelect ? (
          <div className="bg-[var(--panel)] rounded-xl p-4 space-y-4">
            <h2 className="text-[var(--text-primary)] font-semibold">Choose your opponent</h2>
            <BotSelector selectedBot={pendingBot} onSelect={setPendingBot} />
            <div className="bg-[var(--panel-alt)] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{pendingBot.avatar}</span>
                <div>
                  <div className="text-[var(--text-primary)] font-medium">{pendingBot.name}</div>
                  <div className="text-[var(--text-muted)] text-xs">ELO {pendingBot.elo}</div>
                </div>
              </div>
              <p className="text-[var(--text-muted)] text-xs italic">"{pendingBot.tagline}"</p>
              <p className="text-[var(--text-secondary)] text-xs mt-2">{pendingBot.bio}</p>
            </div>
            <button
              onClick={handleNewGame}
              className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-lg transition-colors"
            >
              Play as White
            </button>
          </div>
        ) : (
          <>
            <GamePanel
              status={status}
              moveHistory={moveHistory}
              capturedPieces={capturedPieces}
              selectedBot={selectedBot}
              isGameOver={isGameOver}
              onNewGame={() => setShowBotSelect(true)}
              onUndo={undoMove}
              onResign={resign}
              onFlip={() => setOrientation(o => o === 'white' ? 'black' : 'white')}
              canUndo={moveHistory.length >= 2}
            />

            {isGameOver && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    const chess = new Chess()
                    const uciMoves = moveHistory.map(san => {
                      const move = chess.move(san)
                      return move.from + move.to + (move.promotion ?? '')
                    })
                    navigate('/review', { state: { uciMoves, playerColor: 'white' } })
                  }}
                  className="w-full py-2.5 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--text-primary)] font-medium rounded-lg transition-colors"
                >
                  Review Game
                </button>
                <button
                  onClick={() => setShowBotSelect(true)}
                  className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-lg transition-colors"
                >
                  Play Again
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
