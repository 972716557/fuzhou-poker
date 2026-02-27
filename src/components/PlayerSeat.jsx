import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Card from './Card.jsx'
import { useGame } from '../game/GameContext.jsx'
import { PHASE } from '../../shared/constants.js'
import { getHandRank, getHandColor } from '../../shared/handRank.js'

export default function PlayerSeat({ player, index, position, isCurrentTurn }) {
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
  }

  // 手牌：只有服务端发来 hand !== null 才有牌可看
  const hasHand = player.hand && player.hand.length === 2
  const handRank = hasHand ? getHandRank(player.hand[0], player.hand[1]) : null
  const rankColor = handRank ? getHandColor(handRank) : '#fff'

  return (
    <motion.div
      className="absolute flex flex-col items-center"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
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
            style={{ position: 'absolute', top: '-28px', left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}
            className={`whitespace-nowrap text-xs font-bold px-3 py-1 rounded-full shadow-lg ${labelColorMap[actionLabel] || 'bg-gray-600 text-white'}`}
          >
            {actionLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 玩家头像 */}
      <motion.div
        className={`relative w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 shadow-lg
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
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
            D
          </div>
        )}

        {/* 断线标记 */}
        {isDisconnected && (
          <div className="absolute -top-1 -left-1 w-5 h-5 bg-red-700 rounded-full flex items-center justify-center text-white shadow" style={{ fontSize: 10 }}>
            !
          </div>
        )}

        {/* "你"标记 */}
        {isMe && (
          <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
            我
          </div>
        )}
      </motion.div>

      {/* 玩家名称 */}
      <div className={`text-xs mt-1 font-bold truncate max-w-[70px] text-center
        ${isMe ? 'text-emerald-300' : isCurrentTurn ? 'text-yellow-300' : isActive ? 'text-gray-200' : 'text-gray-600'}
      `}>
        {player.name}
      </div>

      {/* 筹码 */}
      <div className={`text-xs ${isActive ? 'text-yellow-400' : 'text-gray-600'}`}>
        ${player.chips}
      </div>

      {/* 本轮下注 */}
      {player.currentBet > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-xs text-orange-300 bg-orange-900/50 px-1.5 rounded-full mt-0.5"
        >
          注:{player.currentBet}
        </motion.div>
      )}

      {/* 牌面（发牌阶段隐藏） */}
      {!isDealing && phase !== PHASE.WAITING && (
        <div className="flex gap-0.5 mt-1">
          {hasHand ? (
            <>
              <Card card={player.hand[0]} small delay={0} />
              <Card card={player.hand[1]} small delay={0.1} />
            </>
          ) : (
            // 有手牌但未看牌（或别人的牌被隐藏）：显示背面
            phase !== PHASE.WAITING && (
              <>
                <Card faceDown small delay={0} />
                <Card faceDown small delay={0.1} />
              </>
            )
          )}
        </div>
      )}

      {/* 摊牌后显示牌型 */}
      {showCards && handRank && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-bold mt-0.5 px-2 py-0.5 rounded-full"
          style={{ color: rankColor, backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          {handRank.name}
        </motion.div>
      )}

      {/* 弃牌标记 */}
      {player.hasFolded && (
        <div className="text-xs text-red-400 font-bold">弃牌</div>
      )}

      {/* 赢家动画 */}
      {isWinner && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="text-sm font-bold text-green-400 mt-0.5"
        >
          赢家!
        </motion.div>
      )}
    </motion.div>
  )
}
