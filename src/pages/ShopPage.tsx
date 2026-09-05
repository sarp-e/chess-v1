import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { shopItemsOfType, type ShopItem } from '../data/shop'
import {
  addCustomBackground,
  deleteCustomBackground,
  isAllowedImage,
  listCustomBackgrounds,
  type CustomBackground,
} from '../lib/bgStore'
import type { BackgroundId, ColorTheme } from '../types'

const THEME_SWATCH: Record<string, [string, string]> = {
  'slate-mono': ['#eaeaea', '#9a9a9a'],
  'championship-green': ['#eeeed2', '#6f9a4c'],
  forest: ['#e5dcc3', '#7c8f5a'],
  ocean: ['#e2eef0', '#4d8a97'],
}

function Preview({ item }: { item: ShopItem }) {
  if (item.type === 'colorTheme') {
    const [light, dark] = THEME_SWATCH[item.value] ?? ['#ccc', '#888']
    return (
      <div
        className="aspect-video rounded-md border border-[var(--border)]"
        style={{ background: `linear-gradient(135deg, ${light} 50%, ${dark} 50%)` }}
      />
    )
  }
  if (item.type === 'background') {
    return <div className="bg-swatch aspect-video border border-[var(--border)]" data-bg-style={item.value} />
  }
  // pieceSet
  return (
    <div className="aspect-video rounded-md border border-[var(--border)] bg-[var(--panel-alt)] grid place-items-center text-2xl tracking-widest text-[var(--text-primary)]">
      ♞ ♝ ♜
    </div>
  )
}

function ItemCard({
  item,
  owned,
  active,
  balance,
  signedIn,
  onBuy,
  onEquip,
}: {
  item: ShopItem
  owned: boolean
  active: boolean
  balance: number
  signedIn: boolean
  onBuy: (item: ShopItem) => void
  onEquip: (item: ShopItem) => void
}) {
  const canAfford = balance >= item.price
  return (
    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-3 flex flex-col gap-2">
      <Preview item={item} />
      <div>
        <div className="text-[var(--text-primary)] text-sm font-medium">{item.label}</div>
        <div className="text-[var(--text-muted)] text-xs">{item.blurb}</div>
      </div>
      {active ? (
        <button
          disabled
          className="mt-auto py-1.5 text-xs font-medium rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]"
        >
          Equipped
        </button>
      ) : owned ? (
        <button
          onClick={() => onEquip(item)}
          className="mt-auto py-1.5 text-xs font-medium rounded-lg bg-[var(--panel-alt)] text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
        >
          Equip
        </button>
      ) : (
        <button
          onClick={() => onBuy(item)}
          disabled={!signedIn || !canAfford}
          className="mt-auto py-1.5 text-xs font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
        >
          {!signedIn ? 'Sign in to buy' : canAfford ? `Buy · ${item.price} 🪙` : `${item.price} 🪙 — not enough`}
        </button>
      )}
    </div>
  )
}

export default function ShopPage() {
  const { tokens, isUnlocked, unlockItem } = useWallet()
  const { user } = useAuth()
  const { settings, updateSettings } = useSettings()
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const [customs, setCustoms] = useState<CustomBackground[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const signedIn = !!user

  useEffect(() => {
    listCustomBackgrounds().then(setCustoms)
  }, [])

  const refreshCustoms = () => listCustomBackgrounds().then(setCustoms)

  const handleBuy = async (item: ShopItem) => {
    setMessage(null)
    setBusy(item.id)
    const ok = await unlockItem(item.id)
    setBusy(null)
    if (ok) {
      equip(item)
    } else {
      setMessage(`Couldn't buy ${item.label} — you have ${tokens} 🪙, it costs ${item.price}.`)
    }
  }

  const equip = (item: ShopItem) => {
    if (item.type === 'pieceSet') updateSettings({ pieceSet: item.value as 'standard' | 'cburnett' })
    else if (item.type === 'colorTheme') updateSettings({ colorTheme: item.value as ColorTheme })
    else updateSettings({ background: item.value as BackgroundId })
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const err = isAllowedImage(file)
    if (err) {
      setMessage(err)
      return
    }
    setMessage(null)
    const record = await addCustomBackground(file)
    await refreshCustoms()
    updateSettings({ background: `custom:${record.id}` })
  }

  const removeCustom = async (id: string) => {
    await deleteCustomBackground(id)
    if (settings.background === `custom:${id}`) updateSettings({ background: 'none' })
    refreshCustoms()
  }

  const sections: { type: ShopItem['type']; title: string }[] = [
    { type: 'background', title: 'Backgrounds' },
    { type: 'colorTheme', title: 'Board Themes' },
    { type: 'pieceSet', title: 'Piece Sets' },
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[var(--text-primary)] text-xl font-bold">Shop</h1>
        {signedIn ? (
          <span className="text-[var(--text-secondary)] text-sm font-medium">🪙 {tokens} tokens</span>
        ) : (
          <Link to="/login" className="text-[var(--accent)] text-sm font-medium">
            Sign in to earn &amp; spend →
          </Link>
        )}
      </div>

      {message && (
        <div className="mb-4 text-[var(--danger)] text-sm bg-[var(--danger-soft)] rounded-lg px-3 py-2">{message}</div>
      )}

      {sections.map(section => (
        <section key={section.type} className="mb-8">
          <h2 className="text-[var(--text-primary)] font-semibold mb-3">{section.title}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {shopItemsOfType(section.type).map(item => {
              const owned = isUnlocked(item.id)
              const active =
                (item.type === 'pieceSet' && settings.pieceSet === item.value) ||
                (item.type === 'colorTheme' && settings.colorTheme === item.value) ||
                (item.type === 'background' && settings.background === item.value)
              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  owned={owned}
                  active={active}
                  balance={tokens}
                  signedIn={signedIn}
                  onBuy={busy ? () => {} : handleBuy}
                  onEquip={equip}
                />
              )
            })}
          </div>

          {section.type === 'background' && (
            <div className="mt-4">
              <h3 className="text-[var(--text-secondary)] text-sm font-medium mb-2">Your Images</h3>
              <div
                onDragOver={e => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault()
                  setDragOver(false)
                  handleFiles(e.dataTransfer.files)
                }}
                onClick={() => fileRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${
                  dragOver
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                }`}
              >
                Drop an image here, or click to choose one. Stored on this device only · max 4&nbsp;MB · free.
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={e => {
                  handleFiles(e.target.files)
                  e.target.value = ''
                }}
              />

              {customs.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  {customs.map(c => (
                    <CustomCard
                      key={c.id}
                      record={c}
                      active={settings.background === `custom:${c.id}`}
                      onEquip={() => updateSettings({ background: `custom:${c.id}` })}
                      onRemove={() => removeCustom(c.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      ))}

      <p className="text-[var(--text-muted)] text-xs">
        Win games against bots or online opponents to earn tokens. Purchases are saved to your account; switching between
        things you already own is always free.
      </p>
    </div>
  )
}

function CustomCard({
  record,
  active,
  onEquip,
  onRemove,
}: {
  record: CustomBackground
  active: boolean
  onEquip: () => void
  onRemove: () => void
}) {
  const [url] = useState(() => URL.createObjectURL(record.blob))
  useEffect(() => () => URL.revokeObjectURL(url), [url])

  return (
    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-3 flex flex-col gap-2">
      <div
        className="aspect-video rounded-md border border-[var(--border)] bg-center bg-cover bg-[var(--panel-alt)]"
        style={url ? { backgroundImage: `url(${url})` } : undefined}
      />
      <div className="text-[var(--text-primary)] text-sm font-medium truncate">{record.name}</div>
      <div className="flex gap-2 mt-auto">
        <button
          onClick={onEquip}
          disabled={active}
          className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-[var(--panel-alt)] text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors disabled:bg-[var(--accent-soft)] disabled:text-[var(--accent)]"
        >
          {active ? 'Equipped' : 'Equip'}
        </button>
        <button
          onClick={onRemove}
          className="py-1.5 px-2 text-xs font-medium rounded-lg text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
