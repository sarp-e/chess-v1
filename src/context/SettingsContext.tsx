import React, { createContext, useContext, useReducer, useEffect } from 'react'
import type { Settings } from '../types'

const DEFAULT_SETTINGS: Settings = {
  showLegalMoves: true,
  boardTheme: 'classic',
  pieceSet: 'standard',
}

type SettingsAction = { type: 'UPDATE'; payload: Partial<Settings> }

function settingsReducer(state: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, ...action.payload }
    default:
      return state
  }
}

interface SettingsContextValue {
  settings: Settings
  updateSettings: (partial: Partial<Settings>) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const stored = localStorage.getItem('chess_settings')
  const initial = stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS

  const [settings, dispatch] = useReducer(settingsReducer, initial)

  useEffect(() => {
    localStorage.setItem('chess_settings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = (partial: Partial<Settings>) =>
    dispatch({ type: 'UPDATE', payload: partial })

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
