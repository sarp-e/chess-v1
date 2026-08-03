import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SettingsProvider } from './context/SettingsContext'
import Navbar from './components/Layout/Navbar'
import PlayPage from './pages/PlayPage'
import PuzzlesPage from './pages/PuzzlesPage'
import LearnPage from './pages/LearnPage'
import OnlineLobbyPage from './pages/OnlineLobbyPage'
import OnlineGamePage from './pages/OnlineGamePage'
import GameReviewPage from './pages/GameReviewPage'

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/play" replace />} />
            <Route path="/play" element={<PlayPage />} />
            <Route path="/play/online" element={<OnlineLobbyPage />} />
            <Route path="/play/online/:gameId" element={<OnlineGamePage />} />
            <Route path="/puzzles" element={<PuzzlesPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/review" element={<GameReviewPage />} />
          </Routes>
        </div>
      </BrowserRouter>
      <Analytics />
    </SettingsProvider>
  )
}
