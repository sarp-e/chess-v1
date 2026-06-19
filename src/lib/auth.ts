import { supabase } from './supabase'

const KEY = 'chess_anon_user_id'

export async function getOrCreateUser(): Promise<string> {
  // Return cached user id if present
  const cached = localStorage.getItem(KEY)
  if (cached) {
    // Restore the session with Supabase
    const { data } = await supabase.auth.getSession()
    if (data.session) return cached
  }

  // Sign in anonymously
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error || !data.user) throw new Error(error?.message ?? 'Anonymous sign-in failed')

  localStorage.setItem(KEY, data.user.id)
  return data.user.id
}
