import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/play/online'

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setConfirmMessage(null)
    setSubmitting(true)

    if (mode === 'signIn') {
      const { error } = await signIn(email, password)
      setSubmitting(false)
      if (error) setError(error)
      else navigate(from, { replace: true })
    } else {
      const { error, needsEmailConfirm } = await signUp(email, password)
      setSubmitting(false)
      if (error) setError(error)
      else if (needsEmailConfirm) setConfirmMessage('Check your email to confirm your account, then sign in.')
      else navigate(from, { replace: true })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 space-y-4"
      >
        <h1 className="text-xl font-bold text-[var(--text-primary)] text-center">
          {mode === 'signIn' ? 'Sign In' : 'Create Account'}
        </h1>

        <div className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--panel-alt)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--panel-alt)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {error && <p className="text-[var(--danger)] text-sm">{error}</p>}
        {confirmMessage && <p className="text-[var(--success)] text-sm">{confirmMessage}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Please wait…' : mode === 'signIn' ? 'Sign In' : 'Sign Up'}
        </button>

        <button
          type="button"
          onClick={() => { setMode(m => m === 'signIn' ? 'signUp' : 'signIn'); setError(null); setConfirmMessage(null) }}
          className="w-full text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] transition-colors"
        >
          {mode === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
