import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSettings } from '../../context/SettingsContext'

export default function Navbar() {
  const location = useLocation()
  const { settings, updateSettings } = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
        location.pathname.startsWith(to)
          ? 'bg-white/20 text-white'
          : 'text-white/70 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between relative z-50">
      <div className="flex items-center gap-6">
        <Link to="/play" className="text-white font-bold text-lg tracking-tight">
          ♟ Chess
        </Link>
        <div className="flex items-center gap-1">
          {navLink('/play', 'Play')}
          {navLink('/puzzles', 'Puzzles')}
          {navLink('/learn', 'Learn')}
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setSettingsOpen(o => !o)}
          className="text-white/70 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Settings"
        >
          ⚙️
        </button>

        {settingsOpen && (
          <>
            <div className="fixed inset-0" onClick={() => setSettingsOpen(false)} />
            <div className="absolute right-0 top-9 bg-gray-800 border border-gray-700 rounded-lg p-4 w-64 shadow-xl">
              <h3 className="text-white font-medium mb-3 text-sm">Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block">Board Theme</label>
                  <div className="flex gap-1">
                    {(['classic', 'wood', 'tournament'] as const).map(theme => (
                      <button
                        key={theme}
                        onClick={() => updateSettings({ boardTheme: theme })}
                        className={`flex-1 py-1 text-xs rounded capitalize transition-colors ${
                          settings.boardTheme === theme
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block">Piece Set</label>
                  <div className="flex gap-1">
                    {(['standard', 'cburnett'] as const).map(set => (
                      <button
                        key={set}
                        onClick={() => updateSettings({ pieceSet: set })}
                        className={`flex-1 py-1 text-xs rounded capitalize transition-colors ${
                          settings.pieceSet === set
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {set}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-gray-400 text-xs">Show Legal Moves</label>
                  <button
                    onClick={() => updateSettings({ showLegalMoves: !settings.showLegalMoves })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      settings.showLegalMoves ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.showLegalMoves ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}
