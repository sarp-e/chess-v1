import type { ColorTheme } from '../types'

export type CosmeticType = 'pieceSet' | 'colorTheme' | 'background'

export interface ShopItem {
  id: string // matches item_id in the DB — keep in sync with unlock_cosmetic() in supabase/migrations
  type: CosmeticType
  value: string
  price: number
  label: string
  blurb: string
}

// cburnett pieceSet (the classic set), walnut colorTheme and the "none"
// background are free defaults — not listed here.
export const SHOP_ITEMS: ShopItem[] = [
  { id: 'pieceSet:modern', type: 'pieceSet', value: 'modern', price: 40, label: 'Modern', blurb: 'Flat, geometric silhouettes — a distinct modern look.' },

  { id: 'colorTheme:slate-mono', type: 'colorTheme', value: 'slate-mono', price: 30, label: 'Slate Mono', blurb: 'Greyscale, low-distraction board and UI.' },
  { id: 'colorTheme:championship-green', type: 'colorTheme', value: 'championship-green', price: 30, label: 'Championship', blurb: 'Tournament green with a cream light square.' },
  { id: 'colorTheme:forest', type: 'colorTheme', value: 'forest', price: 30, label: 'Forest', blurb: 'Muted olive and bark tones.' },
  { id: 'colorTheme:ocean', type: 'colorTheme', value: 'ocean', price: 30, label: 'Ocean', blurb: 'Cool teal and sand.' },

  { id: 'background:flat', type: 'background', value: 'flat', price: 40, label: 'Flat', blurb: 'A soft single-tone wash tinted by your theme.' },
  { id: 'background:ambient-glow', type: 'background', value: 'ambient-glow', price: 40, label: 'Ambient Glow', blurb: 'Two large accent-coloured light pools.' },
  { id: 'background:vignette', type: 'background', value: 'vignette', price: 40, label: 'Vignette', blurb: 'Darkened edges that focus the centre.' },
  { id: 'background:checkered', type: 'background', value: 'checkered', price: 40, label: 'Checkered', blurb: 'A faint oversized chequerboard.' },
  { id: 'background:contour', type: 'background', value: 'contour', price: 40, label: 'Contour', blurb: 'Topographic line work.' },
  { id: 'background:photo-aurora', type: 'background', value: 'photo-aurora', price: 40, label: 'Aurora', blurb: 'Green and violet light over deep blue.' },
  { id: 'background:photo-dusk', type: 'background', value: 'photo-dusk', price: 40, label: 'Dusk', blurb: 'Warm sunset haze on plum.' },
  { id: 'background:photo-lagoon', type: 'background', value: 'photo-lagoon', price: 40, label: 'Lagoon', blurb: 'Cyan and sand over teal water.' },
  { id: 'background:custom', type: 'background', value: 'custom-unlock', price: 40, label: 'Custom Image Upload', blurb: 'Unlock uploading your own background images.' },
]

export function isFreeItem(type: CosmeticType, value: string): boolean {
  if (type === 'pieceSet') return value === 'cburnett'
  if (type === 'background') return value === 'none'
  return (value as ColorTheme) === 'walnut'
}

export function shopItemFor(type: CosmeticType, value: string): ShopItem | undefined {
  return SHOP_ITEMS.find(item => item.type === type && item.value === value)
}

export function shopItemsOfType(type: CosmeticType): ShopItem[] {
  return SHOP_ITEMS.filter(item => item.type === type)
}
