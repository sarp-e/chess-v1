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
  const unmountedRef = useRef(false)

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

    if (unmountedRef.current) return

    if (waiting) {
      // Create a game — we're white, opponent is black. The "create game" RLS
      // policy requires the inserter to be white_id, and the waiting player's
      // subscription below only listens for games where they are black_id.
      const { data: newGame, error } = await supabase
        .from('games')
        .insert({
          white_id: userId,
          black_id: waiting.user_id,
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

    // Left the lobby while the upsert was in flight: unmount cleanup saw no
    // channel, so remove the row we just wrote instead of subscribing.
    if (unmountedRef.current) {
      await supabase.from('matchmaking_queue').delete().eq('user_id', userId)
      return
    }

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
          supabase.from('matchmaking_queue').delete().eq('user_id', userId).then()
        }
      )
      .subscribe()

    channelRef.current = channel
  }, [userId])

  // Clean up on unmount — including our queue row, or a later searcher gets
  // paired with us after we've left the lobby.
  useEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        supabase.from('matchmaking_queue').delete().eq('user_id', userId).then()
      }
    }
  }, [userId])

  return { status, gameId, joinQueue, leaveQueue }
}
