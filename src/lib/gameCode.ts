import type { SupabaseClient } from '@supabase/supabase-js'

export const normalizeGameCode = (input: string) => input.trim().toUpperCase()

/** Returns the id of the waiting game with this code, or null if none. */
export async function findWaitingGameByCode(client: SupabaseClient, input: string): Promise<string | null> {
  const code = normalizeGameCode(input)
  if (!code) return null
  const { data, error } = await client
    .from('games')
    .select('id')
    .eq('status', 'waiting')
    .eq('code', code)
    .maybeSingle()
  if (error || !data) return null
  return data.id as string
}
