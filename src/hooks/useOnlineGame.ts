import { useState, useEffect, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import { supabase } from '../lib/supabase'
import type { GameRow } from '../lib/supabase'

export type OnlineGameStatus = 'loading' | 'waiting' | 'active' | 'finished' | 'error'

export interface OnlineGameState {
  fen: string
  moves: string[]
  status: OnlineGameStatus
  result: GameRow['result']
  myColor: 'white' | 'black' | null
  isMyTurn: boolean
  lastMove: { from: string; to: string } | null
  makeMove: (from: string, to: string) => Promise<boolean>
  resign: () => Promise<void>
  offerDraw: () => Promise<void>
}

export function useOnlineGame(gameId: string, userId: string): OnlineGameState {
  const [game, setGame] = useState<GameRow | null>(null)
  const [status, setStatus] = useState<OnlineGameStatus>('loading')
  const gameRef = useRef<GameRow | null>(null)
  gameRef.current = game

  const myColor = game
    ? game.white_id === userId ? 'white' : 'black'
    : null

  const chess = game ? new Chess(game.fen) : new Chess()
  const currentTurn = chess.turn() === 'w' ? 'white' : 'black'
  const isMyTurn = myColor === currentTurn && status === 'active'

  const lastMove = (() => {
    if (!game || game.moves.length === 0) return null
    const last = game.moves[game.moves.length - 1]
    return { from: last.slice(0, 2), to: last.slice(2, 4) }
  })()

  const applyGame = useCallback((g: GameRow) => {
    setGame(g)
    setStatus(g.status === 'waiting' ? 'waiting' : g.status === 'active' ? 'active' : 'finished')
  }, [])

  // Initial load + join as black if needed
  useEffect(() => {
    if (!gameId || !userId) return
    let cancelled = false

    supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()
      .then(async ({ data, error }) => {
        if (cancelled || error || !data) { setStatus('error'); return }
        const g = data as GameRow

        if (g.status === 'waiting' && g.white_id !== userId && !g.black_id) {
          const { error: joinError } = await supabase
            .from('games')
            .update({ black_id: userId, status: 'active' })
            .eq('id', gameId)
          if (cancelled) return
          if (joinError) { setStatus('error'); return }
          applyGame({ ...g, black_id: userId, status: 'active' })
        } else {
          applyGame(g)
        }
      })
  }, [gameId, userId, applyGame])

  // Poll every 2 s while waiting for opponent — more reliable than postgres_changes
  // for the waiting→active transition
  useEffect(() => {
    if (status !== 'waiting' || !gameId) return

    const interval = setInterval(async () => {
      const { data } = await supabase.from('games').select('*').eq('id', gameId).single()
      if (data && data.status !== 'waiting') applyGame(data as GameRow)
    }, 2000)

    return () => clearInterval(interval)
  }, [status, gameId, applyGame])

  // Broadcast channel for real-time move delivery during active game
  useEffect(() => {
    if (!gameId || !userId) return

    const channel = supabase
      .channel(`game-moves:${gameId}`)
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        if (payload?.game) applyGame(payload.game as GameRow)
      })
      .on('broadcast', { event: 'game_over' }, ({ payload }) => {
        if (payload?.game) applyGame(payload.game as GameRow)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [gameId, userId, applyGame])

  const makeMove = useCallback(async (from: string, to: string): Promise<boolean> => {
    const current = gameRef.current
    if (!current || !isMyTurn) return false

    const chess = new Chess(current.fen)
    let result
    try {
      result = chess.move({ from, to, promotion: 'q' })
    } catch {
      return false
    }
    if (!result) return false

    const newMoves = [...current.moves, `${from}${to}`]
    const newFen = chess.fen()

    let newStatus: GameRow['status'] = 'active'
    let newResult: GameRow['result'] = null
    if (chess.isCheckmate()) {
      newStatus = 'finished'
      newResult = myColor === 'white' ? 'white' : 'black'
    } else if (chess.isStalemate() || chess.isDraw()) {
      newStatus = 'finished'
      newResult = 'draw'
    }

    const updatedGame: GameRow = { ...current, fen: newFen, moves: newMoves, status: newStatus, result: newResult }

    // Broadcast to opponent immediately (low latency)
    const event = newStatus === 'finished' ? 'game_over' : 'move'
    supabase.channel(`game-moves:${current.id}`).send({ type: 'broadcast', event, payload: { game: updatedGame } })

    // Persist to DB
    const { error } = await supabase
      .from('games')
      .update({ fen: newFen, moves: newMoves, status: newStatus, result: newResult })
      .eq('id', current.id)

    // Update own state immediately (don't wait for a round-trip)
    applyGame(updatedGame)

    return !error
  }, [isMyTurn, myColor, applyGame])

  const resign = useCallback(async () => {
    const current = gameRef.current
    if (!current) return
    const result: GameRow['result'] = myColor === 'white' ? 'black' : 'white'
    const updatedGame: GameRow = { ...current, status: 'finished', result }
    supabase.channel(`game-moves:${current.id}`).send({ type: 'broadcast', event: 'game_over', payload: { game: updatedGame } })
    await supabase.from('games').update({ status: 'finished', result }).eq('id', current.id)
    applyGame(updatedGame)
  }, [myColor, applyGame])

  const offerDraw = useCallback(async () => {
    const current = gameRef.current
    if (!current) return
    const updatedGame: GameRow = { ...current, status: 'finished', result: 'draw' }
    supabase.channel(`game-moves:${current.id}`).send({ type: 'broadcast', event: 'game_over', payload: { game: updatedGame } })
    await supabase.from('games').update({ status: 'finished', result: 'draw' }).eq('id', current.id)
    applyGame(updatedGame)
  }, [applyGame])

  return {
    fen: game?.fen ?? new Chess().fen(),
    moves: game?.moves ?? [],
    status,
    result: game?.result ?? null,
    myColor,
    isMyTurn,
    lastMove,
    makeMove,
    resign,
    offerDraw,
  }
}
