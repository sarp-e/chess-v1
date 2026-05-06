import { useState, useCallback, useEffect } from 'react'
import { BOTS } from '../data/bots'
import type { Bot } from '../types'
import ChessBoard from '../components/Board/ChessBoard'
import GamePanel from '../components/Play/GamePanel'
import BotSelector from '../components/Play/BotSelector'
import { useChessGame } from '../hooks/useChessGame'
import { useStockfish } from '../hooks/useStockfish'

export default function PlayPage() {
  const [selectedBot, setSelectedBot] = useState<Bot>(BOTS[2]) // Coach Remy default
  const [pendingBot, setPendingBot] = useState<Bot>(BOTS[2])
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')
  const [showBotSelect, setShowBotSelect] = useState(true)

  const {
    status, moveHistory, capturedPieces, lastMove,
    makeMove, makeMoveFromUCI, newGame, undoMove, setThinking,
    fen, turn, isGameOver,
  } = useChessGame()

  const handleBestMove = useCallback((uci: string) => {
    // Apply minimum delay so the bot doesn't respond instantly
    setTimeout(() => {
      makeMoveFromUCI(uci)
      setThinking(false)
    }, 400)
  }, [makeMoveFromUCI, setThinking])

  const { findBestMove } = useStockfish({
    depth: selectedBot.depth,
    onBestMove: handleBestMove,
  })

  // Trigger AI move when it's the bot's turn
  useEffect(() => {
    if (status === 'playing' && turn === 'b' && !isGameOver) {
      setThinking(true)
      // Blunder chance: play at reduced depth
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
        />
      </div>

      {/* Panel */}
      <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-4">
        {showBotSelect ? (
          <div className="bg-gray-900 rounded-xl p-4 space-y-4">
            <h2 className="text-white font-semibold">Choose your opponent</h2>
            <BotSelector selectedBot={pendingBot} onSelect={setPendingBot} />
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{pendingBot.avatar}</span>
                <div>
                  <div className="text-white font-medium">{pendingBot.name}</div>
                  <div className="text-gray-400 text-xs">ELO {pendingBot.elo}</div>
                </div>
              </div>
              <p className="text-gray-500 text-xs italic">"{pendingBot.tagline}"</p>
              <p className="text-gray-400 text-xs mt-2">{pendingBot.bio}</p>
            </div>
            <button
              onClick={handleNewGame}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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
              onFlip={() => setOrientation(o => o === 'white' ? 'black' : 'white')}
              canUndo={moveHistory.length >= 2}
            />

            {isGameOver && (
              <button
                onClick={() => setShowBotSelect(true)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Play Again
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
