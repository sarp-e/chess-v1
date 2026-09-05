import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface WalletContextValue {
  tokens: number
  unlocked: Set<string>
  loading: boolean
  isUnlocked: (itemId: string) => boolean
  awardBotWin: (botElo: number) => Promise<number>
  awardOnlineWin: (gameId: string) => Promise<number>
  unlockItem: (itemId: string) => Promise<boolean>
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [tokens, setTokens] = useState(0)
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setTokens(0)
      setUnlocked(new Set())
      setLoading(false)
      return
    }
    setLoading(true)
    const [{ data: wallet }, { data: unlocks }] = await Promise.all([
      supabase.from('wallets').select('tokens').eq('id', user.id).maybeSingle(),
      supabase.from('unlocked_cosmetics').select('item_id').eq('user_id', user.id),
    ])
    setTokens(wallet?.tokens ?? 0)
    setUnlocked(new Set((unlocks ?? []).map(u => u.item_id as string)))
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const awardBotWin = useCallback(async (botElo: number): Promise<number> => {
    if (!user) return 0
    const { data, error } = await supabase.rpc('award_bot_win', { p_bot_elo: botElo })
    if (error) return 0
    await refresh()
    return (data as number) ?? 0
  }, [user, refresh])

  const awardOnlineWin = useCallback(async (gameId: string): Promise<number> => {
    if (!user) return 0
    const { data, error } = await supabase.rpc('award_online_win', { p_game_id: gameId })
    if (error) return 0
    await refresh()
    return (data as number) ?? 0
  }, [user, refresh])

  const unlockItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (!user) return false
    const { data, error } = await supabase.rpc('unlock_cosmetic', { p_item_id: itemId })
    if (error) return false
    await refresh()
    return Boolean(data)
  }, [user, refresh])

  const isUnlocked = useCallback((itemId: string) => unlocked.has(itemId), [unlocked])

  return (
    <WalletContext.Provider value={{ tokens, unlocked, loading, isUnlocked, awardBotWin, awardOnlineWin, unlockItem }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
