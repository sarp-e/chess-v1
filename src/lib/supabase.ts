import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)

export type GameStatus = 'waiting' | 'active' | 'finished'
export type GameResult = 'white' | 'black' | 'draw'

export interface GameRow {
  id: string
  white_id: string
  black_id: string | null
  fen: string
  moves: string[]
  status: GameStatus
  result: GameResult | null
  created_at: string
  updated_at: string
}
