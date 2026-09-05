import { useEffect, useState } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { getCustomBackground } from '../../lib/bgStore'

// Fixed decorative layer behind the app. Procedural styles are pure CSS keyed by
// data-bg-style; a `custom:<id>` background needs its blob resolved to an object
// URL here.
export default function AppBackground() {
  const { settings } = useSettings()
  const isCustom = settings.background.startsWith('custom:')
  const [customUrl, setCustomUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!isCustom) return
    const id = settings.background.slice('custom:'.length)
    let url: string | null = null
    let active = true
    getCustomBackground(id).then(row => {
      if (!active || !row) return
      url = URL.createObjectURL(row.blob)
      setCustomUrl(url)
    })
    return () => {
      active = false
      setCustomUrl(null)
      if (url) URL.revokeObjectURL(url)
    }
  }, [settings.background, isCustom])

  return (
    <div
      className="app-bg"
      aria-hidden
      data-bg-style={isCustom ? 'custom' : settings.background}
      style={customUrl ? { backgroundImage: `url(${customUrl})` } : undefined}
    />
  )
}
