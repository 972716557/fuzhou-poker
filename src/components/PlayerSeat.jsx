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
  const startPlayerId = gameState?.startPlayerId

  const isMe = player.id === roomState.playerId
  const isActive = player.isActive && !player.hasFolded
  const isWinner = winnerId === player.id
  const isFirstCard = startPlayerId === player.id && phase !== PHASE.WAITING
  const isDealing = !!dealingInfo && phase === PHASE.DEALING
  const isDisconnected = player.isConnected === false
  const showCards = phase === PHASE.SHOWDOWN || phase === PHASE.SETTLEMENT

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

  const labelStyles = {
    '恰提': 'bg-warn/20 text-warn border-warn/30',
    '带上': 'bg-orange-400/20 text-orange-300 border-orange-400/30',
    'All in': 'bg-danger/20 text-danger border-danger/30',
    '跟注': 'bg-accent/20 text-accent border-accent/30',
    '弃牌': 'bg-white/5 text-txt-muted border-white/10',
    '比牌': 'bg-purple-400/20 text-purple-300 border-purple-400/30',
    '开牌': 'bg-purple-400/20 text-purple-300 border-purple-400/30',
  }

  const hasHand = player.hand && player.hand.length === 2
  const handRank = hasHand ? getHandRank(player.hand[0], player.hand[1]) : null
  const rankColor = handRank ? getHandColor(handRank) : '#fff'

  const translateY = isMe ? '-100%' : '-50%'
  const avatarSize = compact ? 'w-8 h-8 text-base' : 'w-11 h-11 text-xl'

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
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Action label */}
      <AnimatePresence>
        {actionLabel && (
          <motion.div
            key={actionLabel + lastActionTsRef.current}
            initial={{ opacity: 0, y: 4, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            style={{ position: 'absolute', top: compact ? -18 : -24, left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}
            className={`whitespace-nowrap font-semibold rounded-full border ${compact ? 'text-[9px] px-2 py-0.5' : 'text-[11px] px-2.5 py-0.5'} ${labelStyles[actionLabel] || 'bg-white/5 text-txt-secondary border-white/10'}`}
          >
            {actionLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar */}
      <div className="relative">
        {/* First card — rotating ambient glow */}
        {isFirstCard && (
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: compact ? -2.5 : -3.5,
              background: 'conic-gradient(from 0deg, rgba(212,168,67,0.6), rgba(184,134,11,0.15), rgba(212,168,67,0.6))',
              filter: compact ? 'blur(2px)' : 'blur(3px)',
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          />
        )}

        <motion.div
          className={`relative rounded-full flex items-center justify-center ${avatarSize}
            ${isCurrentTurn ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface' : ''}
            ${isWinner ? 'ring-2 ring-gold ring-offset-1 ring-offset-surface' : ''}
            ${!isActive && phase !== PHASE.WAITING ? 'opacity-30' : ''}
            ${isDisconnected ? 'opacity-20' : ''}
          `}
          style={{
            background: isMe
              ? 'linear-gradient(135deg, #1a3a2e, #0f2920)'
              : 'linear-gradient(135deg, #1f2937, #111827)',
            border: isMe
              ? '1.5px solid rgba(52, 211, 153, 0.4)'
              : '1.5px solid rgba(255,255,255,0.08)',
          }}
          animate={isCurrentTurn ? { scale: [1, 1.06, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <span>{player.avatar}</span>
        </motion.div>

        {/* Disconnected */}
        {isDisconnected && (
          <div className={`absolute -top-0.5 -left-0.5 bg-danger/80 rounded-full flex items-center justify-center text-white shadow-sm ${compact ? 'w-3 h-3 text-[7px]' : 'w-4 h-4 text-[9px]'}`}>
            !
          </div>
        )}

        {/* Me marker */}
        {isMe && (
          <div className={`absolute -bottom-0.5 -left-0.5 bg-accent rounded-full flex items-center justify-center text-surface font-bold shadow-sm ${compact ? 'w-3 h-3 text-[7px]' : 'w-4 h-4 text-[9px]'}`}>
            我
          </div>
        )}
      </div>

      {/* Name + Chips group */}
      <div className={`flex flex-col items-center ${compact ? 'mt-0.5 gap-0' : 'mt-1 gap-0'}`}>
        <div className={`font-medium truncate text-center leading-tight
          ${compact ? 'text-[9px] max-w-[48px]' : 'text-[11px] max-w-[64px]'}
          ${isMe ? 'text-accent' : isCurrentTurn ? 'text-warn' : isActive ? 'text-txt-secondary' : 'text-txt-muted'}
        `}>
          {player.name}
        </div>
        <div className={`tabular-nums leading-tight ${compact ? 'text-[8px]' : 'text-[10px]'} ${isActive ? 'text-gold/80' : 'text-txt-muted'}`}>
          {player.chips}
          {player.initialChips != null && (
            <span className="text-white/20 ml-0.5">/{player.initialChips}</span>
          )}
        </div>
      </div>

      {/* First card — "先手" pill */}
      {isFirstCard && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`${compact ? 'text-[7px] px-1.5 mt-0' : 'text-[9px] px-2 mt-0.5'} py-px rounded-full font-semibold tracking-wide`}
          style={{
            background: 'linear-gradient(135deg, rgba(212,168,67,0.2), rgba(184,134,11,0.12))',
            color: '#d4a843',
            border: '1px solid rgba(212,168,67,0.3)',
            boxShadow: '0 0 8px rgba(212,168,67,0.15)',
          }}
        >
          先手
        </motion.div>
      )}

      {/* Bet + Status badges */}
      {(player.currentBet > 0 || (player.wantsToOpen && isActive && phase === PHASE.BETTING)) && (
        <div className={`flex items-center gap-1 ${compact ? 'mt-0' : 'mt-0.5'}`}>
          {player.currentBet > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`badge bg-orange-400/10 text-orange-300 border border-orange-400/20 ${compact ? 'text-[7px] px-1 py-0' : 'text-[9px] px-1.5 py-0'}`}
            >
              {player.currentBet}
            </motion.div>
          )}
          {player.wantsToOpen && isActive && phase === PHASE.BETTING && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`badge bg-purple-400/10 text-purple-300 border border-purple-400/20 ${compact ? 'text-[7px] px-1 py-0' : 'text-[9px] px-1.5 py-0'}`}
            >
              开
            </motion.div>
          )}
        </div>
      )}

      {/* Cards (not me, not dealing) */}
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

      {/* Hand rank on showdown */}
      {showCards && handRank && (() => {
        const lv = handRank.level
        const isZhiZun = lv === LEVEL.ZHI_ZUN
        const isTopPair = lv === LEVEL.TOP_PAIRS
        const isTianJiuFanWang = lv === LEVEL.TIAN_JIU_FAN_WANG
        return (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={
              isZhiZun
                ? { opacity: [1, 0.85, 1], scale: [1, 1.06, 1] }
                : isTopPair
                  ? { x: [0, -2, 2, -1, 1, 0] }
                  : { opacity: 1, y: 0 }
            }
            transition={
              isZhiZun
                ? { duration: 1.2, repeat: Infinity }
                : isTopPair
                  ? { duration: 0.5, repeat: Infinity, repeatDelay: 1 }
                  : { duration: 0.3 }
            }
            className={`rounded-full ${compact ? 'text-[9px] mt-0 px-1.5 py-0.5' : 'text-[11px] mt-0.5 px-2.5 py-0.5'} ${
              isZhiZun
                ? 'font-black text-gold-light'
                : isTopPair
                  ? 'font-bold text-purple-300'
                  : isTianJiuFanWang
                    ? 'font-bold text-danger'
                    : 'font-semibold'
            }`}
            style={{
              ...((!isZhiZun && !isTopPair && !isTianJiuFanWang) && { color: rankColor }),
              backgroundColor: 'rgba(0,0,0,0.6)',
              ...(isZhiZun && {
                textShadow: '0 0 8px rgba(232, 197, 106, 0.8)',
              }),
              ...(isTianJiuFanWang && {
                textShadow: '0 0 4px rgba(248, 113, 113, 0.7)',
              }),
            }}
          >
            {handRank.name}
          </motion.div>
        )
      })()}

      {/* Folded */}
      {player.hasFolded && (
        <div className={`text-danger/60 font-medium ${compact ? 'text-[9px]' : 'text-[11px]'}`}>弃牌</div>
      )}

      {/* Winner */}
      {isWinner && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className={`font-bold text-accent ${compact ? 'text-[10px] mt-0' : 'text-xs mt-0.5'}`}
        >
          赢家
        </motion.div>
      )}
    </motion.div>
  )
}
