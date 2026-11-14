import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Demo mode: Vercel sets VERCEL_ENV=preview during preview builds, which have
// no Supabase env vars configured. DEMO_MODE=1 forces it locally. Baked in as
// a compile-time constant so production builds dead-code-eliminate it.
const isDemo = process.env.VERCEL_ENV === 'preview' || process.env.DEMO_MODE === '1'

export default defineConfig({
  plugins: [react()],
  define: {
    __DEMO_MODE__: JSON.stringify(isDemo),
  },
  optimizeDeps: {
    exclude: ['stockfish'],
  },
})
