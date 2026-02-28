import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Card from './Card.jsx'
import { useGame } from '../game/GameContext.jsx'
import { PHASE } from '../../shared/constants.js'
import { getHandRank, getHandColor, LEVEL } from '../../shared/handRank.js'

export default function PlayerSeat({ player, index, position, isCurrentTurn, compact = false }) {
  const { gameState, roomState, dealingInfo } = useGame()

  const phase = gameState?.phase || PHASE.WAITING
  const winnerId = gameState?.winnerId
  const dealerPlayerId = gameState?.dealerPlayerId

  const isMe = player.id === roomState.playerId
  const isActive = player.isActive && !player.hasFolded
  const isWinner = winnerId === player.id
  const isDealer = dealerPlayerId === player.id
  const isDealing = !!dealingInfo && phase === PHASE.DEALING
  const isDisconnected = player.isConnected === false
  const showCards = phase === PHASE.SHOWDOWN || phase === PHASE.SETTLEMENT

  // 操作提示浮动标签
  const [actionLabel, setActionLabel] = useState(null)
  const lastActionTsRef = useRef(null)

  useEffect(() => {
    const la = gameState?.lastAction
    if (la && la.playerId === player.id && la.ts !== lastActionTsRef.current) {
      lastActionTsRef.current = la.ts
      setActionLabel(la.label)
      const timer = setTimeout(() => setActionLabel(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [gameState?.lastAction, player.id])

  const labelColorMap = {
    '恰提': 'bg-yellow-400 text-black',
    '带上': 'bg-orange-400 text-black',
    'All in': 'bg-red-500 text-white',
    '跟注': 'bg-green-600 text-white',
    '弃牌': 'bg-gray-500 text-white',
    '比牌': 'bg-purple-500 text-white',
    '加注': 'bg-orange-500 text-white',
    '开牌': 'bg-purple-500 text-white',
  }

  // 手牌：只有服务端发来 hand !== null 才有牌可看
  const hasHand = player.hand && player.hand.length === 2
  const handRank = hasHand ? getHandRank(player.hand[0], player.hand[1]) : null
  const rankColor = handRank ? getHandColor(handRank) : '#fff'

  // 自己：整块在座位点上方（-100%），牌绝不伸入底部操作栏
  // 其他玩家：居中对齐（-50%）
  const translateY = isMe ? '-100%' : '-50%'

  return (
    <motion.div
      className="absolute flex flex-col items-center"
      style={{
        left: position.x,
        top: position.y,
        transform: `translate(-50%, ${translateY})`,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
    >
      {/* 操作提示浮动标签 */}
      <AnimatePresence>
        {actionLabel && (
          <motion.div
            key={actionLabel + lastActionTsRef.current}
            initial={{ opacity: 0, y: 5, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute', top: compact ? -20 : -28, left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}
            className={`whitespace-nowrap font-bold rounded-full shadow-lg ${compact ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'} ${labelColorMap[actionLabel] || 'bg-gray-600 text-white'}`}
          >
            {actionLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 玩家头像：手机端 compact 时缩小，保证在桌缘不压桌 */}
      <motion.div
        className={`relative rounded-full flex items-center justify-center border-2 shadow-lg
          ${compact ? 'w-9 h-9 text-lg' : 'w-12 h-12 text-2xl'}
          ${isCurrentTurn ? 'border-yellow-400 ring-2 ring-yellow-400 ring-opacity-50' : ''}
          ${isWinner ? 'border-green-400 ring-2 ring-green-400' : ''}
          ${!isActive && phase !== PHASE.WAITING ? 'opacity-40 grayscale' : ''}
          ${isDisconnected ? 'opacity-30' : ''}
          ${isMe ? 'border-emerald-400' : 'border-gray-500'}
        `}
        style={{ background: isActive ? '#2d3748' : '#1a1a2e' }}
        animate={isCurrentTurn ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <span>{player.avatar}</span>

        {/* 庄家标记 */}
        {isDealer && (
          <div className={`absolute -top-0.5 -right-0.5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow ${compact ? 'w-3.5 h-3.5 text-[8px]' : 'w-5 h-5 text-xs'}`}>
            D
          </div>
        )}

        {/* 断线标记 */}
        {isDisconnected && (
          <div className={`absolute -top-0.5 -left-0.5 bg-red-700 rounded-full flex items-center justify-center text-white shadow ${compact ? 'w-3.5 h-3.5 text-[8px]' : 'w-5 h-5'}`} style={{ fontSize: compact ? 8 : 10 }}>
            !
          </div>
        )}

        {/* "你"标记 */}
        {isMe && (
          <div className={`absolute -bottom-0.5 -left-0.5 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow ${compact ? 'w-3.5 h-3.5 text-[8px]' : 'w-5 h-5 text-xs'}`}>
            我
          </div>
        )}
      </motion.div>

      {/* 玩家名称 */}
      <div className={`font-bold truncate text-center
        ${compact ? 'text-[10px] mt-0.5 max-w-[52px]' : 'text-xs mt-1 max-w-[70px]'}
        ${isMe ? 'text-emerald-300' : isCurrentTurn ? 'text-yellow-300' : isActive ? 'text-gray-200' : 'text-gray-600'}
      `}>
        {player.name}
      </div>

      {/* 筹码 */}
      <div className={`${compact ? 'text-[10px]' : 'text-xs'} ${isActive ? 'text-yellow-400' : 'text-gray-600'}`}>
        ${player.chips}
      </div>

      {/* 本轮下注 */}
      {player.currentBet > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`text-orange-300 bg-orange-900/50 rounded-full ${compact ? 'text-[10px] px-1 py-0.5 mt-0' : 'text-xs px-1.5 mt-0.5'}`}
        >
          注:{player.currentBet}
        </motion.div>
      )}

      {/* 提议开牌标记 */}
      {player.wantsToOpen && isActive && phase === PHASE.BETTING && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`text-purple-300 bg-purple-900/60 rounded-full ${compact ? 'text-[10px] px-1 py-0.5 mt-0' : 'text-xs px-1.5 mt-0.5'}`}
        >
          想开牌
        </motion.div>
      )}

      {/* 牌面（发牌阶段隐藏）；“我”的手牌已移到桌面上显示，此处不重复渲染；compact 时用更小牌 */}
      {!isDealing && phase !== PHASE.WAITING && !isMe && (
        <div className={`flex gap-0.5 ${compact ? 'mt-0.5' : 'mt-1'}`}>
          {hasHand ? (
            <>
              <Card card={player.hand[0]} small tiny={compact} delay={0} />
              <Card card={player.hand[1]} small tiny={compact} delay={0.1} />
            </>
          ) : (
            phase !== PHASE.WAITING && (
              <>
                <Card faceDown small tiny={compact} delay={0} />
                <Card faceDown small tiny={compact} delay={0.1} />
              </>
            )
          )}
        </div>
      )}

      {/* 摊牌后显示牌型（Level 10 金色闪烁 / Level 9 紫色震动 / Level 7 红色加粗） */}
      {showCards && handRank && (() => {
        const lv = handRank.level
        const isZhiZun = lv === LEVEL.ZHI_ZUN
        const isTopPair = lv === LEVEL.TOP_PAIRS
        const isTianJiuFanWang = lv === LEVEL.TIAN_JIU_FAN_WANG
        return (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={
              isZhiZun
                ? { opacity: [1, 0.85, 1], scale: [1, 1.08, 1] }
                : isTopPair
                  ? { x: [0, -3, 3, -2, 2, 0] }
                  : { opacity: 1, y: 0 }
            }
            transition={
              isZhiZun
                ? { duration: 1.2, repeat: Infinity }
                : isTopPair
                  ? { duration: 0.5, repeat: Infinity, repeatDelay: 0.8 }
                  : { duration: 0.3 }
            }
            className={`rounded-full ${compact ? 'text-[10px] mt-0 px-1.5 py-0.5' : 'text-xs mt-0.5 px-2 py-0.5'} ${
              isZhiZun
                ? 'font-black text-amber-300'
                : isTopPair
                  ? 'font-bold text-purple-300'
                  : isTianJiuFanWang
                    ? 'font-black text-red-400'
                    : 'font-bold'
            }`}
            style={{
              ...((!isZhiZun && !isTopPair && !isTianJiuFanWang) && { color: rankColor }),
              backgroundColor: 'rgba(0,0,0,0.7)',
              ...(isZhiZun && {
                textShadow: '0 0 8px rgba(251,191,36,0.9), 0 0 16px rgba(245,158,11,0.6)',
              }),
              ...(isTianJiuFanWang && {
                textShadow: '0 0 4px rgba(248,113,113,0.8)',
              }),
            }}
          >
            {handRank.name}
          </motion.div>
        )
      })()}

      {/* 弃牌标记 */}
      {player.hasFolded && (
        <div className={`text-red-400 font-bold ${compact ? 'text-[10px]' : 'text-xs'}`}>弃牌</div>
      )}

      {/* 赢家动画 */}
      {isWinner && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className={`font-bold text-green-400 ${compact ? 'text-[10px] mt-0' : 'text-sm mt-0.5'}`}
        >
          赢家!
        </motion.div>
      )}
    </motion.div>
  )
}
