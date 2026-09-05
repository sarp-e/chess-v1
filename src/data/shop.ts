import type { ColorTheme } from '../types'

export interface ShopItem {
  id: string // matches item_id in the DB — keep in sync with unlock_cosmetic() in supabase/migrations
  type: 'pieceSet' | 'colorTheme'
  value: string
  price: number
}

// standard pieceSet and walnut colorTheme are free defaults — not listed here.
export const SHOP_ITEMS: ShopItem[] = [
  { id: 'pieceSet:cburnett', type: 'pieceSet', value: 'cburnett', price: 40 },
  { id: 'colorTheme:slate-mono', type: 'colorTheme', value: 'slate-mono', price: 30 },
  { id: 'colorTheme:championship-green', type: 'colorTheme', value: 'championship-green', price: 30 },
  { id: 'colorTheme:forest', type: 'colorTheme', value: 'forest', price: 30 },
  { id: 'colorTheme:ocean', type: 'colorTheme', value: 'ocean', price: 30 },
]

export function isFreeItem(type: 'pieceSet' | 'colorTheme', value: string): boolean {
  if (type === 'pieceSet') return value === 'standard'
  return (value as ColorTheme) === 'walnut'
}

export function shopItemFor(type: 'pieceSet' | 'colorTheme', value: string): ShopItem | undefined {
  return SHOP_ITEMS.find(item => item.type === type && item.value === value)
}
