// Shown only in demo mode (see src/lib/demo.ts) — dead-code-eliminated from
// production builds since App.tsx only renders this behind `DEMO_MODE &&`.
export default function DemoBanner() {
  return (
    <div className="bg-[var(--accent-soft)] text-[var(--accent)] text-xs text-center py-1.5 px-3">
      Test site — demo mode. Nothing is saved to your account.
    </div>
  )
}
