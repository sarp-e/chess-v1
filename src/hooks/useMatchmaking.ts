import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export type MatchmakingStatus = 'idle' | 'searching' | 'matched' | 'error'

export interface MatchmakingState {
  status: MatchmakingStatus
  gameId: string | null
  joinQueue: () => Promise<void>
  leaveQueue: () => Promise<void>
}

export function useMatchmaking(userId: string): MatchmakingState {
  const [status, setStatus] = useState<MatchmakingStatus>('idle')
  const [gameId, setGameId] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const leaveQueue = useCallback(async () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    await supabase.from('matchmaking_queue').delete().eq('user_id', userId)
    setStatus('idle')
  }, [userId])

  const joinQueue = useCallback(async () => {
    setStatus('searching')

    // Check for a waiting opponent first
    const { data: waiting } = await supabase
      .from('matchmaking_queue')
      .select('user_id')
      .neq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (waiting) {
      // Create a game — we're white, opponent is black (randomise later)
      const isWhite = Math.random() > 0.5
      const { data: newGame, error } = await supabase
        .from('games')
        .insert({
          white_id: isWhite ? userId : waiting.user_id,
          black_id: isWhite ? waiting.user_id : userId,
          status: 'active',
        })
        .select('id')
        .single()

      if (error || !newGame) {
        setStatus('error')
        return
      }

      // Remove both players from queue
      await supabase
        .from('matchmaking_queue')
        .delete()
        .in('user_id', [userId, waiting.user_id])

      setGameId(newGame.id)
      setStatus('matched')
      return
    }

    // No opponent yet — add to queue and wait
    await supabase
      .from('matchmaking_queue')
      .upsert({ user_id: userId }, { onConflict: 'user_id' })

    // Subscribe to games table to detect when someone creates a game for us
    const channel = supabase
      .channel(`matchmaking:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'games',
          filter: `black_id=eq.${userId}`,
        },
        (payload) => {
          setGameId(payload.new.id)
          setStatus('matched')
          supabase.from('matchmaking_queue').delete().eq('user_id', userId)
        }
      )
      .subscribe()

    channelRef.current = channel
  }, [userId])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  return { status, gameId, joinQueue, leaveQueue }
}
