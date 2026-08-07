import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSettings } from '../../context/SettingsContext'
import { useAuth } from '../../context/AuthContext'
import type { ColorTheme } from '../../types'

const THEMES: { id: ColorTheme; label: string; light: string; dark: string }[] = [
  { id: 'walnut',              label: 'Walnut',        light: '#f0d9b5', dark: '#b58863' },
  { id: 'slate-mono',         label: 'Slate Mono',    light: '#eaeaea', dark: '#9a9a9a' },
  { id: 'championship-green', label: 'Championship',  light: '#eeeed2', dark: '#6f9a4c' },
  { id: 'forest',             label: 'Forest',        light: '#e5dcc3', dark: '#7c8f5a' },
  { id: 'ocean',              label: 'Ocean',         light: '#e2eef0', dark: '#4d8a97' },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings()
  const { user, signOut } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const navLink = (to: string, label: string, exact = false) => {
    const active = exact ? location.pathname === to : location.pathname.startsWith(to)
    return (
      <Link
        to={to}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          active
            ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--overlay)]'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav className="bg-[var(--panel)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between relative z-50">
      <div className="flex items-center gap-6">
        <Link to="/play" className="text-[var(--text-primary)] font-bold text-lg tracking-tight">
          ♟ Chess
        </Link>
        <div className="flex items-center gap-1">
          {navLink('/play', 'Play', true)}
          {navLink('/play/online', 'Online')}
          {navLink('/puzzles', 'Puzzles')}
          {navLink('/learn', 'Learn')}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)] text-xs hidden sm:inline">{user.email}</span>
            <button
              onClick={() => signOut().then(() => navigate('/play'))}
              className="px-3 py-1.5 rounded text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--overlay)] transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          navLink('/login', 'Sign in')
        )}

        <div className="relative">
          <button
            onClick={() => setSettingsOpen(o => !o)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded hover:bg-[var(--overlay)] transition-colors"
            title="Settings"
          >
            ⚙️
          </button>

          {settingsOpen && (
            <>
              <div className="fixed inset-0" onClick={() => setSettingsOpen(false)} />
              <div className="absolute right-0 top-9 bg-[var(--panel)] border border-[var(--border)] rounded-lg p-4 w-64 shadow-xl max-h-[calc(100vh-4.5rem)] overflow-y-auto">
                <h3 className="text-[var(--text-primary)] font-medium mb-3 text-sm">Settings</h3>

                <div className="space-y-4">
                  {/* Theme swatches */}
                  <div>
                    <label className="text-[var(--text-muted)] text-xs mb-1.5 block">Theme</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {THEMES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => updateSettings({ colorTheme: t.id })}
                          title={t.label}
                          className={`aspect-square rounded-md border-2 transition-colors ${
                            settings.colorTheme === t.id
                              ? 'border-[var(--accent)]'
                              : 'border-transparent hover:border-[var(--border)]'
                          }`}
                          style={{ background: `linear-gradient(135deg, ${t.light} 50%, ${t.dark} 50%)` }}
                        />
                      ))}
                    </div>
                    <div className="text-[var(--text-muted)] text-xs mt-1 text-center">
                      {THEMES.find(t => t.id === settings.colorTheme)?.label}
                    </div>
                  </div>

                  {/* Appearance: system / light / dark */}
                  <div>
                    <label className="text-[var(--text-muted)] text-xs mb-1.5 block">Appearance</label>
                    <div className="flex gap-1">
                      {(['system', 'light', 'dark'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => updateSettings({ colorMode: mode })}
                          className={`flex-1 py-1 text-xs rounded capitalize transition-colors ${
                            settings.colorMode === mode
                              ? 'bg-[var(--accent)] text-white'
                              : 'bg-[var(--panel-alt)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Piece set */}
                  <div>
                    <label className="text-[var(--text-muted)] text-xs mb-1.5 block">Piece Set</label>
                    <div className="flex gap-1">
                      {(['standard', 'cburnett'] as const).map(set => (
                        <button
                          key={set}
                          onClick={() => updateSettings({ pieceSet: set })}
                          className={`flex-1 py-1 text-xs rounded capitalize transition-colors ${
                            settings.pieceSet === set
                              ? 'bg-[var(--accent)] text-white'
                              : 'bg-[var(--panel-alt)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                          }`}
                        >
                          {set}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Show legal moves */}
                  <div className="flex items-center justify-between">
                    <label className="text-[var(--text-muted)] text-xs">Show Legal Moves</label>
                    <button
                      onClick={() => updateSettings({ showLegalMoves: !settings.showLegalMoves })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        settings.showLegalMoves ? 'bg-[var(--accent)]' : 'bg-[var(--panel-alt)]'
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.showLegalMoves ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Allow premoves */}
                  <div className="flex items-center justify-between">
                    <label className="text-[var(--text-muted)] text-xs">Allow Premoves</label>
                    <button
                      onClick={() => updateSettings({ allowPremove: !settings.allowPremove })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        settings.allowPremove ? 'bg-[var(--accent)]' : 'bg-[var(--panel-alt)]'
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.allowPremove ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
