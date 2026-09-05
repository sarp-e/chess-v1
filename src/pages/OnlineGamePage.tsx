import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOnlineGame } from '../hooks/useOnlineGame'
import { useWallet } from '../context/WalletContext'
import ChessBoard from '../components/Board/ChessBoard'

function StatusBanner({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="bg-[var(--panel-alt)] rounded-xl p-4 text-center">
      <div className="text-[var(--text-primary)] font-semibold">{label}</div>
      {sub && <div className="text-[var(--text-secondary)] text-sm mt-1">{sub}</div>}
    </div>
  )
}

export default function OnlineGamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { awardOnlineWin } = useWallet()
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState<'draw' | 'resign' | null>(null)
  const [tokensEarned, setTokensEarned] = useState<number | null>(null)
  const awardedRef = useRef(false)

  const {
    fen, moves, status, result, myColor, isMyTurn, lastMove,
    drawOfferPending, incomingDrawOffer, rematchGameId,
    makeMove, resign, offerDraw, acceptDraw, declineDraw, requestRematch,
  } = useOnlineGame(gameId ?? '', user!.id)

  useEffect(() => {
    if (rematchGameId) navigate(`/play/online/${rematchGameId}`)
  }, [rematchGameId, navigate])

  // A rematch reuses this same page component with a new gameId param —
  // reset per-game award state so the new game's win can still be claimed.
  useEffect(() => {
    awardedRef.current = false
    setTokensEarned(null)
  }, [gameId])

  useEffect(() => {
    if (status === 'finished' && result === myColor && gameId && !awardedRef.current) {
      awardedRef.current = true
      awardOnlineWin(gameId).then(amount => { if (amount > 0) setTokensEarned(amount) })
    }
  }, [status, result, myColor, gameId, awardOnlineWin])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="text-[var(--text-muted)] text-sm">Loading game…</div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="text-center space-y-2">
          <p className="text-[var(--danger)] font-medium">Could not load game</p>
          <p className="text-[var(--text-secondary)] text-sm">The database may be temporarily down, or this game no longer exists.</p>
          <button onClick={() => navigate('/play/online')} className="text-[var(--accent)] underline text-sm block mt-3 mx-auto">
            Back to lobby
          </button>
        </div>
      </div>
    )
  }

  const resultLabel = (() => {
    if (status !== 'finished' || !result) return null
    if (result === 'draw') return "It's a draw!"
    const winner = result === 'white' ? 'White' : 'Black'
    const isMe = result === myColor
    return `${winner} wins — ${isMe ? 'You won!' : 'You lost.'}`
  })()

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 min-h-[calc(100vh-56px)]">
      {/* Board */}
      <div className="flex-1 flex items-center justify-center">
        <ChessBoard
          fen={fen}
          onMove={(from, to) => { makeMove(from, to); return true }}
          orientation={myColor ?? 'white'}
          disabled={!isMyTurn}
          lastMove={lastMove}
          playerColor={myColor === 'white' ? 'w' : myColor === 'black' ? 'b' : undefined}
        />
      </div>

      {/* Panel */}
      <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-4">

        {/* Waiting for opponent */}
        {status === 'waiting' && (
          <div className="bg-[var(--panel-alt)] rounded-xl p-4 space-y-3">
            <div className="text-[var(--text-primary)] font-semibold text-center">Waiting for opponent</div>
            <p className="text-[var(--text-secondary)] text-sm text-center">Share this link to invite a friend:</p>
            <button
              onClick={handleCopyLink}
              className="w-full py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-lg transition-colors"
            >
              {copied ? 'Copied!' : 'Copy invite link'}
            </button>
            <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] text-xs">
              <span className="inline-block w-3 h-3 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
              Waiting…
            </div>
          </div>
        )}

        {/* Active game info */}
        {status === 'active' && (
          <StatusBanner
            label={isMyTurn ? 'Your turn' : "Opponent's turn"}
            sub={myColor ? `You are ${myColor}` : undefined}
          />
        )}

        {/* Incoming draw offer */}
        {incomingDrawOffer && (
          <div className="bg-[var(--panel-alt)] rounded-xl p-4 space-y-3">
            <p className="text-[var(--text-primary)] text-sm text-center font-medium">Opponent offers a draw</p>
            <div className="flex gap-2">
              <button
                onClick={acceptDraw}
                className="flex-1 py-2 bg-[var(--success)] hover:opacity-90 text-white text-sm rounded-lg transition-colors"
              >
                Accept
              </button>
              <button
                onClick={declineDraw}
                className="flex-1 py-2 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--text-secondary)] text-sm rounded-lg transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Game over */}
        {status === 'finished' && resultLabel && (
          <StatusBanner
            label={resultLabel}
            sub={tokensEarned !== null ? `+${tokensEarned} 🪙 tokens earned!` : undefined}
          />
        )}

        {/* Active game actions */}
        {status === 'active' && (
          confirming ? (
            <div className="bg-[var(--panel-alt)] rounded-xl p-4 space-y-3">
              <p className="text-[var(--text-primary)] text-sm text-center">
                {confirming === 'resign' ? 'Are you sure you want to resign?' : 'Are you sure you want to offer a draw?'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (confirming === 'resign') resign()
                    else offerDraw()
                    setConfirming(null)
                  }}
                  className={`flex-1 py-2 text-white text-sm rounded-lg transition-colors ${
                    confirming === 'resign'
                      ? 'bg-[var(--danger)] hover:opacity-90'
                      : 'bg-[var(--success)] hover:opacity-90'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirming(null)}
                  className="flex-1 py-2 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--text-secondary)] text-sm rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming('draw')}
                disabled={drawOfferPending || incomingDrawOffer}
                className="flex-1 py-2 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--text-secondary)] text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {drawOfferPending ? 'Draw offered…' : 'Draw'}
              </button>
              <button
                onClick={() => setConfirming('resign')}
                className="flex-1 py-2 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--danger)] text-sm rounded-lg transition-colors"
              >
                Resign
              </button>
            </div>
          )
        )}

        {/* Post-game actions */}
        {status === 'finished' && (
          <div className="flex flex-col gap-2">
            <button
              onClick={requestRematch}
              className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-lg transition-colors"
            >
              Rematch
            </button>
            <button
              onClick={() => navigate('/review', { state: { uciMoves: moves, playerColor: myColor ?? 'white' } })}
              className="w-full py-2.5 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--text-primary)] font-medium rounded-lg transition-colors"
            >
              Review Game
            </button>
            <button
              onClick={() => navigate('/play/online')}
              className="w-full py-2.5 bg-[var(--panel-alt)] hover:bg-[var(--border)] text-[var(--text-secondary)] font-medium rounded-lg transition-colors"
            >
              Back to lobby
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
