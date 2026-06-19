import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getOrCreateUser } from '../lib/auth'
import { useMatchmaking } from '../hooks/useMatchmaking'

export default function OnlineLobbyPage() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [authError, setAuthError] = useState(false)
  const [creatingGame, setCreatingGame] = useState(false)

  useEffect(() => {
    getOrCreateUser()
      .then(setUserId)
      .catch((e) => { console.error('Auth error:', e); setAuthError(true) })
  }, [])

  const { status: mmStatus, gameId: mmGameId, joinQueue, leaveQueue } = useMatchmaking(userId ?? '')

  // Redirect when matchmaking finds a game
  useEffect(() => {
    if (mmStatus === 'matched' && mmGameId) {
      navigate(`/play/online/${mmGameId}`)
    }
  }, [mmStatus, mmGameId, navigate])

  const handleCreateGame = async () => {
    if (!userId) return
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

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <p className="text-red-400">Failed to connect. Please refresh and try again.</p>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="text-gray-400 text-sm">Connecting…</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] gap-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Play Online</h1>
        <p className="text-gray-400">Challenge a friend or find a random opponent</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        {/* Invite a friend */}
        <button
          onClick={handleCreateGame}
          disabled={creatingGame || mmStatus === 'searching'}
          className="flex-1 flex flex-col items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl p-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-3xl">🔗</span>
          <span className="text-white font-semibold">Create Game</span>
          <span className="text-gray-400 text-xs text-center">Get an invite link to share with a friend</span>
          {creatingGame && <span className="text-blue-400 text-xs">Creating…</span>}
        </button>

        {/* Random matchmaking */}
        <button
          onClick={mmStatus === 'searching' ? leaveQueue : joinQueue}
          disabled={creatingGame}
          className="flex-1 flex flex-col items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl p-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-3xl">🎲</span>
          <span className="text-white font-semibold">
            {mmStatus === 'searching' ? 'Searching…' : 'Find Opponent'}
          </span>
          <span className="text-gray-400 text-xs text-center">
            {mmStatus === 'searching' ? 'Click to cancel' : 'Get paired with a random player'}
          </span>
          {mmStatus === 'searching' && (
            <span className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          )}
        </button>
      </div>
    </div>
  )
}
