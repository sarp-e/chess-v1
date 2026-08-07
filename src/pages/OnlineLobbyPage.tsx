import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMatchmaking } from '../hooks/useMatchmaking'

export default function OnlineLobbyPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user!.id
  const [creatingGame, setCreatingGame] = useState(false)

  const { status: mmStatus, gameId: mmGameId, joinQueue, leaveQueue } = useMatchmaking(userId)

  useEffect(() => {
    if (mmStatus === 'matched' && mmGameId) {
      navigate(`/play/online/${mmGameId}`)
    }
  }, [mmStatus, mmGameId, navigate])

  const handleCreateGame = async () => {
    setCreatingGame(true)
    const { data, error } = await supabase
      .from('games')
      .insert({ white_id: userId, status: 'waiting' })
      .select('id')
      .single()

    setCreatingGame(false)
    if (!error && data) {
      navigate(`/play/online/${data.id}`)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] gap-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Play Online</h1>
        <p className="text-[var(--text-secondary)]">Challenge a friend or find a random opponent</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        {/* Invite a friend */}
        <button
          onClick={handleCreateGame}
          disabled={creatingGame || mmStatus === 'searching'}
          className="flex-1 flex flex-col items-center gap-2 bg-[var(--panel)] hover:bg-[var(--panel-alt)] border border-[var(--border)] rounded-xl p-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-3xl">🔗</span>
          <span className="text-[var(--text-primary)] font-semibold">Create Game</span>
          <span className="text-[var(--text-muted)] text-xs text-center">Get an invite link to share with a friend</span>
          {creatingGame && <span className="text-[var(--accent)] text-xs">Creating…</span>}
        </button>

        {/* Random matchmaking */}
        <button
          onClick={mmStatus === 'searching' ? leaveQueue : joinQueue}
          disabled={creatingGame}
          className="flex-1 flex flex-col items-center gap-2 bg-[var(--panel)] hover:bg-[var(--panel-alt)] border border-[var(--border)] rounded-xl p-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-3xl">🎲</span>
          <span className="text-[var(--text-primary)] font-semibold">
            {mmStatus === 'searching' ? 'Searching…' : 'Find Opponent'}
          </span>
          <span className="text-[var(--text-muted)] text-xs text-center">
            {mmStatus === 'searching' ? 'Click to cancel' : 'Get paired with a random player'}
          </span>
          {mmStatus === 'searching' && (
            <span className="inline-block w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          )}
        </button>
      </div>
    </div>
  )
}
