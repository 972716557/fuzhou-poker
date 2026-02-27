import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/GameContext.jsx'

/**
 * 发牌动画组件（多人同步版）
 *
 * 数据来源：服务端 DEAL_START 消息中的 dealingInfo
 * 动画完成后：发送 DEAL_ANIM_DONE 给服务端
 * 服务端收齐所有人的 DONE 后发 GAME_STATE(BETTING)
 */

const SUB_PHASE = {
  DECK_SHOW: 'DECK_SHOW',
  HAND_CUT: 'HAND_CUT',
  CARD_REVEAL: 'CARD_REVEAL',
  COUNTING: 'COUNTING',
  DEALING: 'DEALING',
  DONE: 'DONE',
}

const suitSymbols = { spade: '♠', heart: '♥', club: '♣', diamond: '♦', joker: '★' }
const suitColors = { spade: '#1a1a2e', heart: '#e74c3c', club: '#1a1a2e', diamond: '#e74c3c', joker: '#9b59b6' }

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

  // 阶段推进
  useEffect(() => {
    let timer
    switch (subPhase) {
      case SUB_PHASE.DECK_SHOW:
        timer = setTimeout(() => setSubPhase(SUB_PHASE.HAND_CUT), 800)
        break
      case SUB_PHASE.HAND_CUT:
        timer = setTimeout(() => setSubPhase(SUB_PHASE.CARD_REVEAL), 1200)
        break
      case SUB_PHASE.CARD_REVEAL:
        timer = setTimeout(() => {
          setCountIndex(0)
          setSubPhase(SUB_PHASE.COUNTING)
        }, 1500)
        break
      default:
        break
    }
    return () => clearTimeout(timer)
  }, [subPhase])

  // 数人动画
  useEffect(() => {
    if (subPhase !== SUB_PHASE.COUNTING) return
    if (countIndex >= cutValue) {
      const timer = setTimeout(() => setSubPhase(SUB_PHASE.DEALING), 600)
      return () => clearTimeout(timer)
    }
    const seatIdx = (dealerIndex + countIndex) % playerCount
    setCountHighlight(seatIdx)
    const timer = setTimeout(() => setCountIndex(prev => prev + 1), 350)
    return () => clearTimeout(timer)
  }, [subPhase, countIndex, cutValue, dealerIndex, playerCount])

  // 发牌动画
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
        }, 500)
        return
      }

      const { seatIdx } = dealOrder[step]
      const id = `fly_${step}`

      setFlyingCards(prev => [...prev, { id, seatIdx }])
      setDealtSeats(prev => ({ ...prev, [seatIdx]: (prev[seatIdx] || 0) + 1 }))

      setTimeout(() => {
        setFlyingCards(prev => prev.filter(c => c.id !== id))
      }, 400)

      step++
    }, 150)

    return () => clearInterval(interval)
  }, [subPhase, playerCount, startPlayerIndex, actions, animDone])

  const isJoker = cutCard.suit === 'joker'
  const cardColor = suitColors[cutCard.suit] || '#333'

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {/* 数人高亮 */}
      {subPhase === SUB_PHASE.COUNTING && countHighlight >= 0 && seatPositions[countHighlight] && (
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
            className="w-16 h-16 rounded-full border-4 border-yellow-400 absolute"
            style={{
              left: 0, top: 28, transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 20px rgba(250, 204, 21, 0.6)',
            }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.8 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="text-2xl font-black text-yellow-300 text-center"
            style={{ textShadow: '0 0 12px rgba(250, 204, 21, 0.8)' }}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {countIndex + 1}
          </motion.div>
        </motion.div>
      )}

      {/* 中央牌堆 */}
      <AnimatePresence>
        {(subPhase !== SUB_PHASE.DEALING && subPhase !== SUB_PHASE.DONE) && (
          <motion.div
            className="absolute z-30"
            style={{ left: centerX, top: centerY, transform: 'translate(-50%, -50%)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="relative">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-16 h-24 rounded-lg bg-gradient-to-br from-blue-700 to-blue-950 border-2 border-blue-500 shadow-lg"
                  style={{ top: -i * 2, left: -i * 0.5, zIndex: i }}
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="w-full h-full flex items-center justify-center text-blue-400/50 text-sm font-bold">
                    {i === 5 ? '🂠' : ''}
                  </div>
                </motion.div>
              ))}

              {/* 手动画 */}
              {(subPhase === SUB_PHASE.HAND_CUT || subPhase === SUB_PHASE.CARD_REVEAL || subPhase === SUB_PHASE.COUNTING) && (
                <motion.div
                  className="absolute z-20 text-5xl select-none"
                  style={{ top: -20, left: 80 }}
                  initial={{ x: 80, y: 30, rotate: 30, opacity: 0 }}
                  animate={
                    subPhase === SUB_PHASE.HAND_CUT
                      ? { x: [80, 10, 10], y: [30, 10, 10], rotate: [30, -5, -5], opacity: [0, 1, 1] }
                      : { x: 10, y: 10, rotate: -5, opacity: subPhase === SUB_PHASE.CARD_REVEAL ? 0 : 0.3 }
                  }
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                >
                  🤚
                </motion.div>
              )}

              {/* 翻开的切牌 */}
              {(subPhase === SUB_PHASE.CARD_REVEAL || subPhase === SUB_PHASE.COUNTING) && (
                <motion.div
                  className="absolute z-30"
                  style={{ left: 80, top: -30 }}
                  initial={{ rotateY: 180, scale: 0.5 }}
                  animate={{ rotateY: 0, scale: 1.2 }}
                  transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
                >
                  <div
                    className="w-20 h-28 rounded-lg bg-white border-2 border-gray-200 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden"
                    style={{ color: cardColor, boxShadow: '0 0 30px rgba(255,255,255,0.3)' }}
                  >
                    <div className="absolute top-1 left-1.5 flex flex-col items-center leading-tight">
                      <span className="font-bold text-sm">{cutCard.display}</span>
                      <span className="text-xs">{suitSymbols[cutCard.suit]}</span>
                    </div>
                    <div className="font-bold text-3xl">
                      {isJoker ? (cutCard.value === 'BIG' ? '大' : '小') : suitSymbols[cutCard.suit]}
                    </div>
                    <div className="absolute bottom-1 right-1.5 flex flex-col items-center leading-tight rotate-180">
                      <span className="font-bold text-sm">{cutCard.display}</span>
                      <span className="text-xs">{suitSymbols[cutCard.suit]}</span>
                    </div>
                  </div>
                  <motion.div
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-yellow-300 text-sm font-bold px-3 py-1 rounded-full"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    数 {cutValue} 位
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 发牌阶段中央小牌堆 */}
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
              className="absolute rounded-md bg-gradient-to-br from-blue-700 to-blue-950 border border-blue-500 shadow"
              style={{ top: -i * 1.5, left: -i * 0.5 - 24, height: 64, width: 44 }}
            />
          ))}
        </motion.div>
      )}

      {/* 飞行中的牌 */}
      <AnimatePresence>
        {flyingCards.map(({ id, seatIdx }) => {
          const target = seatPositions[seatIdx]
          if (!target) return null
          return (
            <motion.div
              key={id}
              className="absolute z-40 w-10 h-14 rounded-md bg-gradient-to-br from-blue-700 to-blue-950 border border-blue-400 shadow-lg"
              style={{ left: centerX - 20, top: centerY - 28 }}
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{
                x: target.x - centerX,
                y: target.y - centerY + 40,
                scale: 0.7,
                opacity: 0.8,
                rotate: (Math.random() - 0.5) * 20,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="w-full h-full flex items-center justify-center text-blue-300/40 text-xs">🂠</div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* 已到位的牌 */}
      {subPhase === SUB_PHASE.DEALING && Object.entries(dealtSeats).map(([seatIdxStr, count]) => {
        const seatIdx = parseInt(seatIdxStr)
        const pos = seatPositions[seatIdx]
        if (!pos) return null
        return Array.from({ length: count }).map((_, ci) => (
          <motion.div
            key={`dealt_${seatIdx}_${ci}`}
            className="absolute w-8 h-12 rounded bg-gradient-to-br from-blue-800 to-blue-950 border border-blue-500 shadow"
            style={{
              left: pos.x - 12 + ci * 12,
              top: pos.y + 36,
              transform: 'translate(-50%, 0)',
              zIndex: 10,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          />
        ))
      })}

      {/* 顶部提示 */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          className="bg-black/70 backdrop-blur text-white text-sm font-bold px-5 py-2 rounded-full"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {subPhase === SUB_PHASE.DECK_SHOW && '🂠 准备切牌...'}
          {subPhase === SUB_PHASE.HAND_CUT && '✋ 切牌中...'}
          {subPhase === SUB_PHASE.CARD_REVEAL && `翻到了 ${cutCard.name}！数 ${cutValue} 位`}
          {subPhase === SUB_PHASE.COUNTING && `正在数位... ${countIndex + 1} / ${cutValue}`}
          {subPhase === SUB_PHASE.DEALING && '🃏 发牌中...'}
          {subPhase === SUB_PHASE.DONE && '等待其他玩家...'}
        </motion.div>
      </div>
    </div>
  )
}
