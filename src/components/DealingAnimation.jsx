import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/GameContext.jsx'

const SUB_PHASE = {
  DECK_SHOW: 'DECK_SHOW',
  HAND_CUT: 'HAND_CUT',
  CARD_REVEAL: 'CARD_REVEAL',
  COUNTING: 'COUNTING',
  DEALING: 'DEALING',
  DONE: 'DONE',
}

const suitSymbols = { spade: '♠', heart: '♥', club: '♣', diamond: '♦', joker: '★' }
const suitColors = { spade: '#1a1a2e', heart: '#dc2626', club: '#1a1a2e', diamond: '#dc2626', joker: '#7c3aed' }

export default function DealingAnimation({ seatPositions }) {
  const { dealingInfo, gameState, actions } = useGame()

  const [subPhase, setSubPhase] = useState(SUB_PHASE.DECK_SHOW)
  const [countIndex, setCountIndex] = useState(0)
  const [countHighlight, setCountHighlight] = useState(-1)
  const [flyingCards, setFlyingCards] = useState([])
  const [dealtSeats, setDealtSeats] = useState({})
  const [animDone, setAnimDone] = useState(false)

  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 600
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 400

  if (!dealingInfo) return null

  const { cutCard, cutValue, startPlayerIndex, dealerIndex } = dealingInfo
  const players = gameState?.players || []
  const playerCount = players.length || seatPositions.length

  useEffect(() => {
    let timer
    switch (subPhase) {
      case SUB_PHASE.DECK_SHOW:
        timer = setTimeout(() => setSubPhase(SUB_PHASE.HAND_CUT), 300)
        break
      case SUB_PHASE.HAND_CUT:
        timer = setTimeout(() => setSubPhase(SUB_PHASE.CARD_REVEAL), 400)
        break
      case SUB_PHASE.CARD_REVEAL:
        timer = setTimeout(() => {
          setCountIndex(0)
          setSubPhase(SUB_PHASE.COUNTING)
        }, 500)
        break
      default:
        break
    }
    return () => clearTimeout(timer)
  }, [subPhase])

  // 自适应计数速度：数值越大，每次越快（最慢180ms，最快100ms）
  const countDelay = Math.max(100, Math.min(180, Math.round(1200 / cutValue)))

  useEffect(() => {
    if (subPhase !== SUB_PHASE.COUNTING) return
    if (countIndex >= cutValue) {
      const timer = setTimeout(() => setSubPhase(SUB_PHASE.DEALING), 200)
      return () => clearTimeout(timer)
    }
    const seatIdx = (dealerIndex + countIndex) % playerCount
    setCountHighlight(seatIdx)
    const timer = setTimeout(() => setCountIndex(prev => prev + 1), countDelay)
    return () => clearTimeout(timer)
  }, [subPhase, countIndex, cutValue, dealerIndex, playerCount, countDelay])

  useEffect(() => {
    if (subPhase !== SUB_PHASE.DEALING) return

    const dealOrder = []
    for (let round = 0; round < 2; round++) {
      for (let i = 0; i < playerCount; i++) {
        const seatIdx = (startPlayerIndex + i) % playerCount
        dealOrder.push({ seatIdx, cardIndex: round })
      }
    }

    let step = 0
    const interval = setInterval(() => {
      if (step >= dealOrder.length) {
        clearInterval(interval)
        setTimeout(() => {
          setSubPhase(SUB_PHASE.DONE)
          if (!animDone) {
            setAnimDone(true)
            actions.dealAnimDone()
          }
        }, 200)
        return
      }

      const { seatIdx } = dealOrder[step]
      const id = `fly_${step}`

      setFlyingCards(prev => [...prev, { id, seatIdx }])
      setDealtSeats(prev => ({ ...prev, [seatIdx]: (prev[seatIdx] || 0) + 1 }))

      setTimeout(() => {
        setFlyingCards(prev => prev.filter(c => c.id !== id))
      }, 220)

      step++
    }, 80)

    return () => clearInterval(interval)
  }, [subPhase, playerCount, startPlayerIndex, actions, animDone])

  const isJoker = cutCard.suit === 'joker'
  const isBigJoker = isJoker && cutCard.value === 'BIG'
  const jokerAccent = isBigJoker ? '#cc1122' : '#2563eb'
  const jokerText = isBigJoker ? '#cc1122' : '#1a1a2e'
  const cardColor = suitColors[cutCard.suit] || '#333'

  const cardBack = 'bg-gradient-to-br from-blue-800 to-blue-950 border border-blue-500/40'

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {/* Count highlight — only show while actively counting (not the exit frame) */}
      {subPhase === SUB_PHASE.COUNTING && countIndex < cutValue && countHighlight >= 0 && seatPositions[countHighlight] && (
        <motion.div
          key={`count_${countIndex}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute z-40"
          style={{
            left: seatPositions[countHighlight].x,
            top: seatPositions[countHighlight].y - 50,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <motion.div
            className="w-14 h-14 rounded-full border-2 border-gold/70 absolute"
            style={{
              left: 0, top: 28, transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 18px rgba(212, 168, 67, 0.4)',
            }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.8 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="text-xl font-bold text-gold-light text-center tabular-nums"
            style={{ textShadow: '0 0 10px rgba(232, 197, 106, 0.6)' }}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {countIndex + 1}
          </motion.div>
        </motion.div>
      )}

      {/* Central deck */}
      <AnimatePresence>
        {(subPhase !== SUB_PHASE.DEALING && subPhase !== SUB_PHASE.DONE) && (
          <motion.div
            className="absolute z-30"
            style={{ left: centerX, top: centerY, transform: 'translate(-50%, -50%)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="relative">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-14 h-20 rounded-lg ${cardBack} shadow-card`}
                  style={{ top: -i * 2, left: -i * 0.5, zIndex: i }}
                  initial={{ y: -80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                />
              ))}

              {/* Hand */}
              {(subPhase === SUB_PHASE.HAND_CUT || subPhase === SUB_PHASE.CARD_REVEAL || subPhase === SUB_PHASE.COUNTING) && (
                <motion.div
                  className="absolute z-20 text-4xl select-none"
                  style={{ top: -16, left: 72 }}
                  initial={{ x: 60, y: 20, rotate: 25, opacity: 0 }}
                  animate={
                    subPhase === SUB_PHASE.HAND_CUT
                      ? { x: [60, 8, 8], y: [20, 6, 6], rotate: [25, -3, -3], opacity: [0, 1, 1] }
                      : { x: 8, y: 6, rotate: -3, opacity: subPhase === SUB_PHASE.CARD_REVEAL ? 0 : 0.2 }
                  }
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                >
                  🤚
                </motion.div>
              )}

              {/* Revealed cut card */}
              {(subPhase === SUB_PHASE.CARD_REVEAL || subPhase === SUB_PHASE.COUNTING) && (
                <motion.div
                  className="absolute z-30"
                  style={{ left: 72, top: -28 }}
                  initial={{ rotateY: 180, scale: 0.5 }}
                  animate={{ rotateY: 0, scale: 1.15 }}
                  transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                >
                  {isJoker ? (
                    <div
                      className="w-16 h-24 rounded-lg shadow-card-lg flex items-center justify-center relative overflow-hidden border-2"
                      style={{
                        borderColor: jokerAccent + '55',
                        background: isBigJoker
                          ? 'linear-gradient(135deg, #fff5f5 0%, #ffe0e0 50%, #ffd6d6 100%)'
                          : '#fff',
                      }}
                    >
                      <div className="absolute top-0.5 left-0.5 flex flex-col items-center leading-[1]" style={{ color: jokerText, fontSize: 8, fontWeight: 900 }}>
                        {'JOKER'.split('').map((ch, i) => <span key={i}>{ch}</span>)}
                      </div>
                      <svg width="28" height="28" viewBox="0 0 64 66" fill="none">
                        <circle cx="37" cy="2" r="2.5" fill={jokerAccent} />
                        <path d="M37 4.5 C36 7 34 10 30 14 Q27 16 24 17.5 L40 17.5 C39 15 38 10 37 4.5Z" fill={jokerAccent} />
                        <ellipse cx="32" cy="18.5" rx="10" ry="2.2" fill={jokerAccent} />
                        <circle cx="32" cy="26" r="7.5" fill="white" stroke={jokerAccent} strokeWidth="1.4" />
                        <ellipse cx="28.5" cy="25" rx="1.6" ry="2" fill={jokerAccent} />
                        <ellipse cx="35.5" cy="25" rx="1.6" ry="2" fill={jokerAccent} />
                        <circle cx="29" cy="24.2" r="0.6" fill="white" />
                        <circle cx="36" cy="24.2" r="0.6" fill="white" />
                        <path d="M31.2 27 Q32 28.2 32.8 27" stroke={jokerAccent} strokeWidth="0.8" strokeLinecap="round" fill="none" />
                        <path d="M27 29.5 Q29.5 33 32 33 Q34.5 33 37 29.5" stroke={jokerAccent} strokeWidth="1.3" strokeLinecap="round" fill="none" />
                        <path d="M16 37 L20.5 33.5 L25 37 L29 33.5 L32 36.5 L35 33.5 L39 37 L43.5 33.5 L48 37" stroke={jokerAccent} strokeWidth="1.2" strokeLinejoin="round" fill={jokerAccent} opacity="0.12" />
                        <path d="M24 37 L17 42 L10 45.5 Q8 46.5 10 47 L18 45.5 L24 47.5 L27 54 L29 59 Q30 61 32 61 Q34 61 35 59 L37 54 L40 47.5 L46 45.5 L54 47 Q56 46.5 54 45.5 L47 42 L40 37Z" fill={jokerAccent} />
                        <circle cx="32" cy="40" r="1" fill="white" opacity="0.3" />
                        <circle cx="32" cy="44" r="1" fill="white" opacity="0.3" />
                        <circle cx="9" cy="46" r="2.2" fill={jokerAccent} />
                        <circle cx="55" cy="46" r="2.2" fill={jokerAccent} />
                        <circle cx="29" cy="61" r="2" fill={jokerAccent} />
                        <circle cx="35" cy="61" r="2" fill={jokerAccent} />
                      </svg>
                      <div className="absolute bottom-0.5 right-0.5 rotate-180 flex flex-col items-center leading-[1]" style={{ color: jokerText, fontSize: 8, fontWeight: 900 }}>
                        {'JOKER'.split('').map((ch, i) => <span key={i}>{ch}</span>)}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-16 h-24 rounded-lg bg-white border border-gray-200 shadow-card-lg flex flex-col items-center justify-center relative overflow-hidden"
                      style={{ color: cardColor }}
                    >
                      <div className="absolute top-0.5 left-1 flex flex-col items-center leading-none">
                        <span className="font-bold text-xs">{cutCard.display}</span>
                        <span className="text-[9px]">{suitSymbols[cutCard.suit]}</span>
                      </div>
                      <div className="font-bold text-2xl">
                        {suitSymbols[cutCard.suit]}
                      </div>
                      <div className="absolute bottom-0.5 right-1 flex flex-col items-center leading-none rotate-180">
                        <span className="font-bold text-xs">{cutCard.display}</span>
                        <span className="text-[9px]">{suitSymbols[cutCard.suit]}</span>
                      </div>
                    </div>
                  )}
                  <motion.div
                    className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap glass-dark text-gold text-[11px] font-semibold px-3 py-1 rounded-full"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    数 {cutValue} 位
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* First card recipient pulse — appears when dealing starts */}
      {(subPhase === SUB_PHASE.DEALING || subPhase === SUB_PHASE.DONE) && seatPositions[startPlayerIndex] && (
        <motion.div
          className="absolute z-35 pointer-events-none"
          style={{
            left: seatPositions[startPlayerIndex].x,
            top: seatPositions[startPlayerIndex].y - 22,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
        >
          <motion.div
            className="w-16 h-16 rounded-full border-2 border-gold/60 absolute"
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 0 20px rgba(212, 168, 67, 0.5)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.3, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          />
          <motion.div
            className="text-[10px] font-bold text-gold-light whitespace-nowrap text-center"
            style={{ textShadow: '0 0 8px rgba(232, 197, 106, 0.6)', marginTop: -8 }}
            initial={{ y: 4, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            先手
          </motion.div>
        </motion.div>
      )}

      {/* Mini deck during dealing */}
      {subPhase === SUB_PHASE.DEALING && (
        <motion.div
          className="absolute z-20"
          style={{ left: centerX, top: centerY, transform: 'translate(-50%, -50%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-md ${cardBack} shadow-sm`}
              style={{ top: -i * 1.5, left: -i * 0.5 - 20, height: 56, width: 38 }}
            />
          ))}
        </motion.div>
      )}

      {/* Flying cards */}
      <AnimatePresence>
        {flyingCards.map(({ id, seatIdx }) => {
          const target = seatPositions[seatIdx]
          if (!target) return null
          return (
            <motion.div
              key={id}
              className={`absolute z-40 w-9 h-12 rounded-md ${cardBack} shadow-card`}
              style={{ left: centerX - 18, top: centerY - 24 }}
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{
                x: target.x - centerX,
                y: target.y - centerY + 36,
                scale: 0.7,
                opacity: 0.8,
                rotate: (Math.random() - 0.5) * 16,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          )
        })}
      </AnimatePresence>

      {/* Dealt cards at seats */}
      {subPhase === SUB_PHASE.DEALING && Object.entries(dealtSeats).map(([seatIdxStr, count]) => {
        const seatIdx = parseInt(seatIdxStr)
        const pos = seatPositions[seatIdx]
        if (!pos) return null
        return Array.from({ length: count }).map((_, ci) => (
          <motion.div
            key={`dealt_${seatIdx}_${ci}`}
            className={`absolute w-7 h-10 rounded ${cardBack} shadow-sm`}
            style={{
              left: pos.x - 10 + ci * 10,
              top: pos.y + 32,
              transform: 'translate(-50%, 0)',
              zIndex: 10,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
          />
        ))
      })}

      {/* Top status */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          className="glass-dark text-txt text-[12px] font-medium px-5 py-2 rounded-full"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {subPhase === SUB_PHASE.DECK_SHOW && '准备切牌...'}
          {subPhase === SUB_PHASE.HAND_CUT && '切牌中...'}
          {subPhase === SUB_PHASE.CARD_REVEAL && `翻到了 ${cutCard.name}！数 ${cutValue} 位`}
          {subPhase === SUB_PHASE.COUNTING && `数位中... ${Math.min(countIndex + 1, cutValue)} / ${cutValue}`}
          {subPhase === SUB_PHASE.DEALING && '发牌中...'}
          {subPhase === SUB_PHASE.DONE && '等待其他玩家...'}
        </motion.div>
      </div>
    </div>
  )
}
