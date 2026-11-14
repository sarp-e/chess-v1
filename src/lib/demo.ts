import type { User } from '@supabase/supabase-js'

// Demo mode runs the preview deploy without Supabase: no sign-in, infinite
// tokens, purchases kept in localStorage instead of the `wallets` table.
// Decided at build time (see the `define` in vite.config.ts) so production
// builds dead-code-eliminate every DEMO_MODE branch.
declare const __DEMO_MODE__: boolean
export const DEMO_MODE = __DEMO_MODE__

export const DEMO_USER: User = {
  id: 'demo-guest',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date(0).toISOString(),
}

export const DEMO_USERNAME = 'Guest'

const UNLOCKED_KEY = 'chess_demo_unlocked'

export function demoLoadUnlocked(): Set<string> {
  try {
    const raw = localStorage.getItem(UNLOCKED_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function demoUnlock(itemId: string): void {
  try {
    const unlocked = demoLoadUnlocked()
    unlocked.add(itemId)
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify([...unlocked]))
  } catch {
    // localStorage may be unavailable (private mode, quota) — unlock just won't persist.
  }
}
