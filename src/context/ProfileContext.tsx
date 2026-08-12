import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface ProfileContextValue {
  username: string | null
  loading: boolean
  setUsername: (username: string) => Promise<{ error: string | null }>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [username, setUsernameState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setUsernameState(null)
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setUsernameState(data?.username ?? null)
        setLoading(false)
      })
  }, [user])

  const setUsername = useCallback(async (newUsername: string) => {
    if (!user) return { error: 'Not signed in' }
    const { error } = await supabase.from('profiles').upsert({ id: user.id, username: newUsername })
    if (error) {
      if (error.code === '23505') return { error: 'That username is already taken.' }
      if (error.code === '23514') return { error: 'Usernames must be 3-20 characters: letters, numbers, underscore, single spaces.' }
      return { error: error.message }
    }
    setUsernameState(newUsername)
    return { error: null }
  }, [user])

  return (
    <ProfileContext.Provider value={{ username, loading, setUsername }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
