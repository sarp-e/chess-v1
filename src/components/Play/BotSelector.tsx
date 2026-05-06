import type { Bot } from '../../types'
import { BOTS } from '../../data/bots'

interface BotSelectorProps {
  selectedBot: Bot
  onSelect: (bot: Bot) => void
}

export default function BotSelector({ selectedBot, onSelect }: BotSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {BOTS.map(bot => (
        <button
          key={bot.id}
          onClick={() => onSelect(bot)}
          className={`p-2 rounded-lg border transition-all text-left ${
            selectedBot.id === bot.id
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'
          }`}
        >
          <div className="text-xl mb-1">{bot.avatar}</div>
          <div className="text-white text-xs font-medium leading-tight">{bot.name}</div>
          <div className="text-gray-500 text-xs">{bot.elo}</div>
        </button>
      ))}
    </div>
  )
}
