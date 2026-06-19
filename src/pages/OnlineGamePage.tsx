import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrCreateUser } from '../lib/auth'
import { useOnlineGame } from '../hooks/useOnlineGame'
import ChessBoard from '../components/Board/ChessBoard'

function StatusBanner({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 text-center">
      <div className="text-white font-semibold">{label}</div>
      {sub && <div className="text-gray-400 text-sm mt-1">{sub}</div>}
    </div>
  )
}

export default function OnlineGamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getOrCreateUser().then(setUserId).catch(() => navigate('/play/online'))
  }, [navigate])

  const { fen, status, result, myColor, isMyTurn, lastMove, makeMove, resign, offerDraw } =
    useOnlineGame(gameId ?? '', userId ?? '')

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!userId || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="text-gray-400 text-sm">Loading game…</div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="text-center">
          <p className="text-red-400 mb-4">Could not load game. It may not exist or you may not have access.</p>
          <button onClick={() => navigate('/play/online')} className="text-blue-400 underline text-sm">
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
    const isMe = result === (myColor === 'white' ? 'white' : 'black')
    return `${winner} wins — ${isMe ? 'You won!' : 'You lost.'}`
  })()

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 min-h-[calc(100vh-56px)]">
      {/* Board */}
      <div className="flex-1 flex items-center justify-center">
        <ChessBoard
          fen={fen}
          onMove={(from, to) => {
            makeMove(from, to)
            return true
          }}
          orientation={myColor ?? 'white'}
          disabled={!isMyTurn}
          lastMove={lastMove}
        />
      </div>

      {/* Panel */}
      <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-4">

        {/* Waiting for opponent */}
        {status === 'waiting' && (
          <div className="bg-gray-900 rounded-xl p-4 space-y-3">
            <div className="text-white font-semibold text-center">Waiting for opponent</div>
            <p className="text-gray-400 text-sm text-center">Share this link to invite a friend:</p>
            <button
              onClick={handleCopyLink}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {copied ? 'Copied!' : 'Copy invite link'}
            </button>
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
              <span className="inline-block w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
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

        {/* Game over */}
        {status === 'finished' && resultLabel && (
          <StatusBanner label={resultLabel} />
        )}

        {/* Actions */}
        {status === 'active' && (
          <div className="flex gap-2">
            <button
              onClick={offerDraw}
              className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
            >
              Draw
            </button>
            <button
              onClick={resign}
              className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-red-400 text-sm rounded-lg transition-colors"
            >
              Resign
            </button>
          </div>
        )}

        {status === 'finished' && (
          <button
            onClick={() => navigate('/play/online')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Back to lobby
          </button>
        )}
      </div>
    </div>
  )
}
