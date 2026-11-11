import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMatchmaking } from '../hooks/useMatchmaking'
import { findWaitingGameByCode } from '../lib/gameCode'

export default function OnlineLobbyPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user!.id
  const [creatingGame, setCreatingGame] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

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

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoining(true)
    setJoinError(null)
    const id = await findWaitingGameByCode(supabase, joinCode)
    setJoining(false)
    if (id) navigate(`/play/online/${id}`)
    else setJoinError('Invalid or already used code')
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

      {/* Join with code */}
      <form
        onSubmit={handleJoinWithCode}
        className="fixed bottom-4 left-4 bg-[var(--panel)] border border-[var(--border)] rounded-xl p-3 space-y-2"
      >
        <label htmlFor="join-code" className="block text-[var(--text-secondary)] text-xs">Join with code</label>
        <div className="flex gap-2">
          <input
            id="join-code"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value); setJoinError(null) }}
            maxLength={6}
            placeholder="ABC123"
            autoComplete="off"
            className="w-24 px-2 py-1 bg-[var(--panel-alt)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm font-mono uppercase tracking-widest"
          />
          <button
            type="submit"
            disabled={joining || !joinCode.trim()}
            className="px-3 py-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join
          </button>
        </div>
        {joinError && <p className="text-[var(--danger)] text-xs">{joinError}</p>}
      </form>
    </div>
  )
}
