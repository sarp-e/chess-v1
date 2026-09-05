import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chess } from 'chess.js'
import { BOTS } from '../data/bots'
import type { Bot, AssistLevel } from '../types'
import ChessBoard from '../components/Board/ChessBoard'
import GamePanel from '../components/Play/GamePanel'
import BotSelector from '../components/Play/BotSelector'
import { useChessGame } from '../hooks/useChessGame'
import { useStockfish } from '../hooks/useStockfish'
import { useWallet } from '../context/WalletContext'

const HINT_DEPTH = 15

export default function PlayPage() {
  const navigate = useNavigate()
  const [selectedBot, setSelectedBot] = useState<Bot>(BOTS[2]) // Coach Remy default
  const [pendingBot, setPendingBot] = useState<Bot>(BOTS[2])
  const [assistLevel, setAssistLevel] = useState<AssistLevel>('assisted')
  const [pendingAssistLevel, setPendingAssistLevel] = useState<AssistLevel>('assisted')
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white')
  const [pendingColor, setPendingColor] = useState<'white' | 'black' | 'random'>('white')
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')
  const [showBotSelect, setShowBotSelect] = useState(true)
  const [hintMove, setHintMove] = useState<string | null>(null)
  const [hintLoading, setHintLoading] = useState(false)

  const {
    status, moveHistory, capturedPieces, lastMove,
    makeMove, makeMoveFromUCI, newGame, undoMove, resign, setThinking,
    fen, turn, isGameOver,
  } = useChessGame()

  // chess.js turn codes for the player and the bot, derived from the chosen side.
  const myTurn = playerColor === 'white' ? 'w' : 'b'
  const botTurn = playerColor === 'white' ? 'b' : 'w'

  const { awardBotWin } = useWallet()
  const [tokensEarned, setTokensEarned] = useState<number | null>(null)
  const awardedRef = useRef(false)

  // Checkmate with the bot to move means the player delivered mate — a win.
  useEffect(() => {
    if (status === 'checkmate' && turn === botTurn && !awardedRef.current) {
      awardedRef.current = true
      awardBotWin(selectedBot.elo).then(amount => { if (amount > 0) setTokensEarned(amount) })
    }
  }, [status, turn, botTurn, selectedBot.elo, awardBotWin])

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
    if (status === 'playing' && turn === botTurn && !isGameOver) {
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
  }, [fen, status, turn, isGameOver, botTurn])

  const handleMove = useCallback((from: string, to: string): boolean => {
    if (turn !== myTurn || status !== 'playing') return false
    const moved = makeMove(from, to)
    if (moved) {
      setHintMove(null)
      setHintLoading(false)
    }
    return moved
  }, [turn, myTurn, status, makeMove])

  const handleNewGame = useCallback(() => {
    setSelectedBot(pendingBot)
    setAssistLevel(pendingAssistLevel)
    const resolvedColor = pendingColor === 'random'
      ? (Math.random() < 0.5 ? 'white' : 'black')
      : pendingColor
    setPlayerColor(resolvedColor)
    setOrientation(resolvedColor)
    setShowBotSelect(false)
    setHintMove(null)
    setHintLoading(false)
    setTokensEarned(null)
    awardedRef.current = false
    newGame()
  }, [pendingBot, pendingAssistLevel, pendingColor, newGame])

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
          disabled={turn !== myTurn || status !== 'playing'}
          lastMove={lastMove}
          playerColor={myTurn}
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
              <label className="text-[var(--text-muted)] text-xs mb-1.5 block">Play As</label>
              <div className="grid grid-cols-3 gap-2">
                {(['white', 'random', 'black'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setPendingColor(c)}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      pendingColor === c
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                        : 'border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--panel-alt)]'
                    }`}
                  >
                    <div className="text-lg leading-none">{c === 'white' ? '♔' : c === 'black' ? '♚' : '🎲'}</div>
                    <div className="text-[var(--text-primary)] text-xs font-medium mt-1 capitalize">{c}</div>
                  </button>
                ))}
              </div>
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
              {pendingColor === 'random' ? 'Play as Random' : pendingColor === 'white' ? 'Play as White' : 'Play as Black'}
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
              canHint={turn === myTurn && status === 'playing'}
            />

            {isGameOver && (
              <div className="flex flex-col gap-2">
                {tokensEarned !== null && (
                  <div className="text-center text-sm text-[var(--accent)] font-medium">
                    +{tokensEarned} 🪙 tokens earned!
                  </div>
                )}
                <button
                  onClick={() => {
                    const chess = new Chess()
                    const uciMoves = moveHistory.map(san => {
                      const move = chess.move(san)
                      return move.from + move.to + (move.promotion ?? '')
                    })
                    navigate('/review', { state: { uciMoves, playerColor } })
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
