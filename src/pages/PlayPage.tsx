import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chess } from 'chess.js'
import { BOTS } from '../data/bots'
import type { Bot, AssistLevel } from '../types'
import ChessBoard from '../components/Board/ChessBoard'
import GamePanel from '../components/Play/GamePanel'
import BotSelector from '../components/Play/BotSelector'
import { useChessGame } from '../hooks/useChessGame'
import { useStockfish } from '../hooks/useStockfish'

const HINT_DEPTH = 15

export default function PlayPage() {
  const navigate = useNavigate()
  const [selectedBot, setSelectedBot] = useState<Bot>(BOTS[2]) // Coach Remy default
  const [pendingBot, setPendingBot] = useState<Bot>(BOTS[2])
  const [assistLevel, setAssistLevel] = useState<AssistLevel>('assisted')
  const [pendingAssistLevel, setPendingAssistLevel] = useState<AssistLevel>('assisted')
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')
  const [showBotSelect, setShowBotSelect] = useState(true)
  const [hintMove, setHintMove] = useState<string | null>(null)
  const [hintLoading, setHintLoading] = useState(false)

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

  // Separate engine instance for player hints, so a hint request in flight can
  // never collide with the bot's own move computation.
  const handleHintMove = useCallback((uci: string) => {
    setHintLoading(false)
    setHintMove(uci)
  }, [])

  const { findBestMove: findHintMove } = useStockfish({
    depth: HINT_DEPTH,
    onBestMove: handleHintMove,
  })

  const handleShowHint = useCallback(() => {
    setHintLoading(true)
    findHintMove(fen)
  }, [fen, findHintMove])

  const handleShowAnswer = useCallback(() => {
    if (!hintMove) return
    makeMoveFromUCI(hintMove)
    setHintMove(null)
  }, [hintMove, makeMoveFromUCI])

  useEffect(() => {
    if (status === 'playing' && turn === 'b' && !isGameOver) {
      setThinking(true)
      const blunder = Math.random() < selectedBot.blunderChance
      const blunderDepth = Math.max(1, selectedBot.depth - 3)
      setTimeout(() => {
        // For already-shallow bots (Wobble, Pip), reducing depth by 3 floors at the
        // same depth they always play at, so "blunder" would be a no-op — fall back
        // to a genuinely random legal move so their bios' claims of playing at random
        // actually happen, instead of always getting Stockfish's depth-1 pick.
        if (blunder && blunderDepth === selectedBot.depth) {
          const game = new Chess(fen)
          const moves = game.moves({ verbose: true })
          const random = moves[Math.floor(Math.random() * moves.length)]
          handleBestMove(random.from + random.to + (random.promotion ?? ''))
        } else {
          findBestMove(fen, blunder ? blunderDepth : selectedBot.depth)
        }
      }, 300)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, status, turn, isGameOver])

  const handleMove = useCallback((from: string, to: string): boolean => {
    if (turn !== 'w' || status !== 'playing') return false
    const moved = makeMove(from, to)
    if (moved) {
      setHintMove(null)
      setHintLoading(false)
    }
    return moved
  }, [turn, status, makeMove])

  const handleNewGame = useCallback(() => {
    setSelectedBot(pendingBot)
    setAssistLevel(pendingAssistLevel)
    setShowBotSelect(false)
    setHintMove(null)
    setHintLoading(false)
    newGame()
  }, [pendingBot, pendingAssistLevel, newGame])

  const handleUndo = useCallback(() => {
    setHintMove(null)
    setHintLoading(false)
    undoMove()
  }, [undoMove])

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
          hintSquare={hintMove ? hintMove.slice(0, 2) : null}
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

            <div>
              <label className="text-[var(--text-muted)] text-xs mb-1.5 block">Play Style</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPendingAssistLevel('assisted')}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    pendingAssistLevel === 'assisted'
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--panel-alt)]'
                  }`}
                >
                  <div className="text-[var(--text-primary)] text-sm font-medium">Assisted</div>
                  <div className="text-[var(--text-muted)] text-xs">Hints &amp; takebacks</div>
                </button>
                <button
                  onClick={() => setPendingAssistLevel('regular')}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    pendingAssistLevel === 'regular'
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--panel-alt)]'
                  }`}
                >
                  <div className="text-[var(--text-primary)] text-sm font-medium">Regular</div>
                  <div className="text-[var(--text-muted)] text-xs">No assists</div>
                </button>
              </div>
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
              onUndo={handleUndo}
              onResign={resign}
              onFlip={() => setOrientation(o => o === 'white' ? 'black' : 'white')}
              canUndo={moveHistory.length >= 2}
              assistLevel={assistLevel}
              hintState={hintLoading ? 'loading' : hintMove ? 'ready' : 'none'}
              onShowHint={handleShowHint}
              onShowAnswer={handleShowAnswer}
              canHint={turn === 'w' && status === 'playing'}
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
