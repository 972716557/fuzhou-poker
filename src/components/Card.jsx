import { motion } from 'framer-motion'

const suitSymbols = { spade: '♠', heart: '♥', club: '♣', diamond: '♦' }
const suitColors = { spade: '#1a1a2e', heart: '#dc2626', club: '#1a1a2e', diamond: '#dc2626' }

// Consistent 5:7 aspect ratio across all sizes
const sizes = {
  tiny:  { w: 'w-7', h: 'h-[40px]', corner: 7, center: 10, suit: 6 },
  small: { w: 'w-10', h: 'h-14', corner: 10, center: 16, suit: 8 },
  full:  { w: 'w-14', h: 'h-[78px]', corner: 13, center: 24, suit: 10 },
}

/**
 * Full-body Jester SVG — classic playing card joker character
 * Reference: pointed hat, round face, star-shaped costume, bells at extremities
 * Optimized for 14–28px with bold readable silhouette
 */
function JesterIcon({ color, size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 66" fill="none">
      {/* ── Pointed hat (curved) ── */}
      <circle cx="37" cy="2" r="2.5" fill={color} />
      <path d="M37 4.5 C36 7 34 10 30 14 Q27 16 24 17.5 L40 17.5 C39 15 38 10 37 4.5Z" fill={color} />
      <ellipse cx="32" cy="18.5" rx="10" ry="2.2" fill={color} />

      {/* ── Face ── */}
      <circle cx="32" cy="26" r="7.5" fill="white" />
      <circle cx="32" cy="26" r="7.5" stroke={color} strokeWidth="1.4" fill="none" />
      {/* Eyes */}
      <ellipse cx="28.5" cy="25" rx="1.6" ry="2" fill={color} />
      <ellipse cx="35.5" cy="25" rx="1.6" ry="2" fill={color} />
      <circle cx="29" cy="24.2" r="0.6" fill="white" />
      <circle cx="36" cy="24.2" r="0.6" fill="white" />
      {/* Nose */}
      <path d="M31.2 27 Q32 28.2 32.8 27" stroke={color} strokeWidth="0.8" strokeLinecap="round" fill="none" />
      {/* Grin */}
      <path d="M27 29.5 Q29.5 33 32 33 Q34.5 33 37 29.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />

      {/* ── Collar ruff (zigzag) ── */}
      <path
        d="M16 37 L20.5 33.5 L25 37 L29 33.5 L32 36.5 L35 33.5 L39 37 L43.5 33.5 L48 37"
        stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" fill={color} opacity="0.12"
      />

      {/* ── Body — star-shaped jester costume ── */}
      <path
        d="M24 37 L17 42 L10 45.5
           Q8 46.5 10 47 L18 45.5 L24 47.5 L27 54 L29 59
           Q30 61 32 61 Q34 61 35 59
           L37 54 L40 47.5 L46 45.5 L54 47
           Q56 46.5 54 45.5 L47 42 L40 37Z"
        fill={color}
      />
      {/* Body center line (costume detail) */}
      <line x1="32" y1="37" x2="32" y2="55" stroke="white" strokeWidth="0.8" opacity="0.25" />
      {/* Belt / waist */}
      <ellipse cx="32" cy="47" rx="8" ry="1.2" fill="white" opacity="0.15" />
      {/* Buttons */}
      <circle cx="32" cy="40" r="1" fill="white" opacity="0.3" />
      <circle cx="32" cy="44" r="1" fill="white" opacity="0.3" />

      {/* ── Bells at extremities ── */}
      {/* Hands */}
      <circle cx="9" cy="46" r="2.2" fill={color} />
      <circle cx="55" cy="46" r="2.2" fill={color} />
      <circle cx="9" cy="45.5" r="0.7" fill="white" opacity="0.35" />
      <circle cx="55" cy="45.5" r="0.7" fill="white" opacity="0.35" />
      {/* Feet */}
      <circle cx="29" cy="61" r="2" fill={color} />
      <circle cx="35" cy="61" r="2" fill={color} />
      <circle cx="29" cy="60.5" r="0.6" fill="white" opacity="0.35" />
      <circle cx="35" cy="60.5" r="0.6" fill="white" opacity="0.35" />
    </svg>
  )
}

/** Vertical "JOKER" text — each letter stacked, matching classic card layout */
function VerticalJoker({ fontSize, color }) {
  return (
    <div className="flex flex-col items-center leading-[1]" style={{ color, fontSize, fontWeight: 900 }}>
      {'JOKER'.split('').map((ch, i) => <span key={i}>{ch}</span>)}
    </div>
  )
}

function JokerCard({ card, s, tiny, small, base, delay }) {
  const isBig = card.value === 'BIG'
  const textColor = isBig ? '#cc1122' : '#1a1a2e'
  const accentColor = isBig ? '#cc1122' : '#2563eb'

  const jesterSize = tiny ? 14 : small ? 20 : 28
  const vertFs = tiny ? 4.5 : small ? 6 : 8

  const bgStyle = isBig
    ? { background: 'linear-gradient(135deg, #fff5f5 0%, #ffe0e0 50%, #ffd6d6 100%)' }
    : { background: '#fff' }

  return (
    <motion.div
      initial={{ rotateY: -180, opacity: 0, scale: 0.5 }}
      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, type: 'spring', stiffness: 200 }}
      className={`${base} flex items-center justify-center relative overflow-hidden border-2`}
      style={{
        perspective: 800,
        ...bgStyle,
        borderColor: accentColor + '55',
      }}
    >
      {/* 左上竖排 JOKER */}
      <div className="absolute top-0.5 left-0.5">
        <VerticalJoker fontSize={vertFs} color={textColor} />
      </div>

      {/* 中间 Jester */}
      <JesterIcon color={accentColor} size={jesterSize} />

      {/* 右下竖排 JOKER (旋转180°) */}
      <div className="absolute bottom-0.5 right-0.5 rotate-180">
        <VerticalJoker fontSize={vertFs} color={textColor} />
      </div>
    </motion.div>
  )
}

export default function Card({ card, faceDown = false, small = false, tiny = false, delay = 0 }) {
  const s = tiny ? sizes.tiny : small ? sizes.small : sizes.full
  const base = `${s.w} ${s.h} rounded-lg select-none shadow-card`

  if (faceDown) {
    return (
      <motion.div
        initial={{ rotateY: 180, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.35, delay }}
        className={`${base} bg-gradient-to-br from-blue-800 to-blue-950 border border-blue-600/50 flex items-center justify-center`}
        style={{ perspective: 800 }}
      >
        <div className="text-blue-400/40 font-bold" style={{ fontSize: tiny ? 10 : 16 }}>?</div>
      </motion.div>
    )
  }

  if (!card) return null

  const isJoker = card.suit === 'joker'

  if (isJoker) {
    return <JokerCard card={card} s={s} tiny={tiny} small={small} base={base} delay={delay} />
  }

  const color = suitColors[card.suit] || '#333'

  return (
    <motion.div
      initial={{ rotateY: -180, opacity: 0, scale: 0.5 }}
      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, type: 'spring', stiffness: 200 }}
      className={`${base} bg-white border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden`}
      style={{ perspective: 800, color }}
    >
      <div className="absolute top-0.5 left-1 flex flex-col items-center leading-none">
        <span className="font-bold" style={{ fontSize: s.corner }}>{card.display}</span>
        <span style={{ fontSize: s.suit }}>{suitSymbols[card.suit]}</span>
      </div>

      <div className="font-bold" style={{ fontSize: s.center }}>
        {suitSymbols[card.suit]}
      </div>

      <div className="absolute bottom-0.5 right-1 flex flex-col items-center leading-none rotate-180">
        <span className="font-bold" style={{ fontSize: s.corner }}>{card.display}</span>
        <span style={{ fontSize: s.suit }}>{suitSymbols[card.suit]}</span>
      </div>
    </motion.div>
  )
}
