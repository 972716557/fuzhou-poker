import { motion } from 'framer-motion'

const suitSymbols = {
  spade: '♠',
  heart: '♥',
  club: '♣',
  diamond: '♦',
  joker: '★',
}

const suitColors = {
  spade: '#1a1a2e',
  heart: '#e74c3c',
  club: '#1a1a2e',
  diamond: '#e74c3c',
  joker: '#9b59b6',
}

export default function Card({ card, faceDown = false, small = false, tiny = false, delay = 0 }) {
  const size = tiny ? 'w-7 h-10 text-[10px]' : small ? 'w-10 h-14 text-xs' : 'w-14 h-20 text-sm'

  if (faceDown) {
    return (
      <motion.div
        initial={{ rotateY: 180, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay }}
        className={`${size} rounded-lg bg-gradient-to-br from-blue-800 to-blue-950 border-2 border-blue-600 flex items-center justify-center shadow-lg cursor-pointer select-none`}
        style={{ perspective: 1000 }}
      >
        <div className="text-blue-400 font-bold" style={{ fontSize: tiny ? 12 : 18 }}>?</div>
      </motion.div>
    )
  }

  if (!card) return null

  const isJoker = card.suit === 'joker'
  const color = suitColors[card.suit] || '#333'

  return (
    <motion.div
      initial={{ rotateY: -180, opacity: 0, scale: 0.5 }}
      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 200 }}
      className={`${size} rounded-lg bg-white border border-gray-300 flex flex-col items-center justify-center shadow-lg select-none relative overflow-hidden`}
      style={{ perspective: 1000, color }}
    >
      {/* 左上角 */}
      <div className="absolute top-0.5 left-1 flex flex-col items-center leading-tight">
        <span className="font-bold" style={{ fontSize: tiny ? 8 : small ? 10 : 13 }}>
          {card.display}
        </span>
        <span style={{ fontSize: tiny ? 6 : small ? 8 : 10 }}>
          {suitSymbols[card.suit]}
        </span>
      </div>

      {/* 中央大字 */}
      <div className="font-bold" style={{ fontSize: tiny ? 10 : small ? 16 : 24 }}>
        {isJoker ? (card.value === 'BIG' ? '大' : '小') : suitSymbols[card.suit]}
      </div>

      {/* 右下角（翻转） */}
      <div className="absolute bottom-0.5 right-1 flex flex-col items-center leading-tight rotate-180">
        <span className="font-bold" style={{ fontSize: tiny ? 8 : small ? 10 : 13 }}>
          {card.display}
        </span>
        <span style={{ fontSize: tiny ? 6 : small ? 8 : 10 }}>
          {suitSymbols[card.suit]}
        </span>
      </div>
    </motion.div>
  )
}
