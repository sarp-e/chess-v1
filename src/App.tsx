import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SettingsProvider } from './context/SettingsContext'
import { AuthProvider } from './context/AuthContext'
import { ProfileProvider } from './context/ProfileContext'
import { WalletProvider } from './context/WalletContext'
import RequireAuth from './components/Auth/RequireAuth'
import Navbar from './components/Layout/Navbar'
import AppBackground from './components/Layout/AppBackground'
import DemoBanner from './components/Layout/DemoBanner'
import PlayPage from './pages/PlayPage'
import PuzzlesPage from './pages/PuzzlesPage'
import LearnPage from './pages/LearnPage'
import LoginPage from './pages/LoginPage'
import OnlineLobbyPage from './pages/OnlineLobbyPage'
import OnlineGamePage from './pages/OnlineGamePage'
import GameReviewPage from './pages/GameReviewPage'
import ShopPage from './pages/ShopPage'
import { DEMO_MODE } from './lib/demo'

// Real online play needs a real account, which demo mode doesn't have — shown
// instead of the lobby/game pages so neither mounts (and neither touches
// Supabase, which has no env vars configured on preview deploys).
function OnlineDisabledNotice() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] p-6 text-center">
      <p className="text-[var(--text-secondary)]">Online play isn&apos;t available on the test site.</p>
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <ProfileProvider>
          <WalletProvider>
            <BrowserRouter>
              <AppBackground />
              <div className="relative z-10 min-h-screen text-[var(--text-primary)]">
                <Navbar />
                {DEMO_MODE && <DemoBanner />}
                <Routes>
                  <Route path="/" element={<Navigate to="/play" replace />} />
                  <Route path="/play" element={<PlayPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/play/online"
                    element={DEMO_MODE ? <OnlineDisabledNotice /> : <RequireAuth><OnlineLobbyPage /></RequireAuth>}
                  />
                  <Route
                    path="/play/online/:gameId"
                    element={DEMO_MODE ? <OnlineDisabledNotice /> : <RequireAuth><OnlineGamePage /></RequireAuth>}
                  />
                  <Route path="/puzzles" element={<PuzzlesPage />} />
                  <Route path="/learn" element={<LearnPage />} />
                  <Route path="/review" element={<GameReviewPage />} />
                  <Route path="/shop" element={<ShopPage />} />
                </Routes>
              </div>
            </BrowserRouter>
          </WalletProvider>
        </ProfileProvider>
      </AuthProvider>
      <Analytics />
    </SettingsProvider>
  )
}
