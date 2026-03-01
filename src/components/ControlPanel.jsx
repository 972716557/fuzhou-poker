import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/GameContext.jsx'
import { PHASE, ACTION_BAR_H, DEFAULT_CONFIG } from '../../shared/constants.js'

export default function ControlPanel() {
  const { gameState, roomState, myPlayer, isMyTurn, isSpectator, startGamePending, actions } = useGame()

  const [showKickMenu, setShowKickMenu] = useState(false)

  const phase = gameState?.phase || PHASE.WAITING
  const players = gameState?.players || []
  const currentBet = gameState?.currentBet || 0
  const bettingRound = gameState?.bettingRound || 0
  const callBetCount = gameState?.callBetCount ?? 0
  const config = gameState?.config || {}
  const isHost = roomState.isHost

  if (phase === PHASE.DEALING) return null
  if (isSpectator) return null

  // Waiting
  if (phase === PHASE.WAITING) {
    const playerCount = roomState.playerList.length
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute left-1/2 glass rounded-2xl z-10 py-5 px-6"
        style={{ top: '45%', transform: 'translate(-50%, -50%)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="text-txt-secondary text-[14px]">
            {playerCount} 位玩家
            {playerCount < 2 && <span className="text-warn ml-2 text-[12px]">(至少需要2人)</span>}
          </div>
          {isHost ? (
            <motion.button
              whileTap={startGamePending ? {} : { scale: 0.97 }}
              onClick={actions.startGame}
              disabled={playerCount < 2 || startGamePending}
              className="btn-primary min-w-[160px]"
            >
              {startGamePending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  发牌中
                </span>
              ) : '开始游戏'}
            </motion.button>
          ) : (
            <div className="text-txt-muted text-[13px]">等待房主开始...</div>
          )}
        </div>
      </motion.div>
    )
  }

  // Settlement
  if (phase === PHASE.SETTLEMENT) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute left-1/2 glass rounded-2xl z-10 py-5 px-6"
        style={{ top: '45%', transform: 'translate(-50%, -50%)' }}
      >
        <div className="flex flex-col items-center">
          {isHost ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={actions.nextRound}
              className="btn-primary min-w-[160px]"
            >
              下一局
            </motion.button>
          ) : (
            <div className="text-txt-muted text-[13px]">等待房主开始下一局...</div>
          )}
        </div>
      </motion.div>
    )
  }

  if (phase !== PHASE.BETTING) return null

  // 动态叫牌文案
  const isChati = bettingRound <= 1 && callBetCount === 0
  const callBetLabel = isChati ? '恰提' : '带上'

  // Not my turn
  if (!isMyTurn || !myPlayer) {
    const currentPlayer = players.find(p => p.id === gameState?.currentPlayerId)
    return (
      <div className="absolute top-14 md:top-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="glass-dark rounded-full px-4 py-2">
          <span className="text-txt-secondary text-[12px]">
            等待 <span className="text-warn font-medium">{currentPlayer?.name || '...'}</span> {callBetLabel}或操作
          </span>
        </div>
      </div>
    )
  }

  // My turn
  const pot = gameState?.pot || 0
  const alreadyWantsOpen = myPlayer?.wantsToOpen || false
  const baseBlind = config.baseBlind ?? DEFAULT_CONFIG.baseBlind

  const callBetAmount = pot
  const isLastCallBetMine = gameState?.lastCallBetPlayerId === myPlayer?.id
  const canCallBet = pot > 0 && !isLastCallBetMine

  const alreadyKicked = myPlayer?.hasKicked || false
  const alreadyCalledBet = myPlayer?.hasCalledBet || false
  const maxKickBet = pot
  const maxKicks = baseBlind > 0 ? Math.min(10, Math.max(0, Math.floor((maxKickBet - currentBet) / baseBlind))) : 0
  const canKick = maxKicks >= 1 && !alreadyKicked && !alreadyCalledBet
  const kickNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

  const hasParticipated = myPlayer?.hasParticipated || false
  const activePlayers = players.filter(p => p.isActive && !p.hasFolded)
  const activeCount = activePlayers.length
  const otherActiveHasParticipated = activePlayers.some(p => p.id !== myPlayer?.id && p.hasParticipated)
  const canFold = !hasParticipated && (activeCount > 2 || otherActiveHasParticipated)

  const canShowdown = hasParticipated && !alreadyWantsOpen

  const btnBase = 'min-h-[44px] rounded-xl font-semibold text-[13px] transition-all duration-150'
  const btnStyle = (variant, disabled) => {
    const styles = {
      accent:  disabled ? 'bg-accent/[0.06] text-accent/30 cursor-not-allowed border border-accent/[0.08]' : 'bg-accent/90 text-surface hover:bg-accent active:bg-accent/80',
      danger:  disabled ? 'bg-danger/[0.06] text-danger/30 cursor-not-allowed border border-danger/[0.08]' : 'bg-danger/80 text-white hover:bg-danger active:bg-danger/70',
      amber:   disabled ? 'bg-amber-500/[0.06] text-amber-400/30 cursor-not-allowed border border-amber-500/[0.08]' : 'bg-amber-500/80 text-white hover:bg-amber-500 active:bg-amber-500/70',
      purple:  disabled ? 'bg-purple-500/[0.06] text-purple-400/30 cursor-not-allowed border border-purple-500/[0.08]' : 'bg-purple-500/80 text-white hover:bg-purple-500 active:bg-purple-500/70',
    }
    return `${btnBase} ${styles[variant] || ''}`
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="absolute left-1/2 glass rounded-2xl z-10 py-3 px-5 cursor-grab active:cursor-grabbing"
      style={{ top: '45%', x: '-50%', y: '-50%', minWidth: 280, minHeight: ACTION_BAR_H }}
    >
      {/* Drag indicator */}
      <div className="flex justify-center pb-2 select-none">
        <div className="w-9 h-[3px] rounded-full bg-white/[0.12]" />
      </div>

      <div className="flex flex-col items-center gap-2.5">
        {/* Status */}
        <div className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3.5 py-1.5 w-full justify-center">
          <span className="text-accent text-[11px] font-semibold">你的回合</span>
          <span className="w-px h-3 bg-white/[0.1]" />
          <span className="text-txt-muted text-[11px]">第{bettingRound}轮</span>
          <span className="w-px h-3 bg-white/[0.1]" />
          <span className="text-gold text-[11px] tabular-nums">底池 {pot}</span>
        </div>

        {/* Row 1: 踢一脚 + 恰提/带上 */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <div className="relative flex">
            <motion.button
              whileTap={!canKick ? {} : { scale: 0.96 }}
              onClick={() => canKick && setShowKickMenu(!showKickMenu)}
              className={`w-full ${btnStyle('amber', !canKick)}`}
            >
              {alreadyKicked ? '已踢过' : alreadyCalledBet ? '已叫牌' : '踢一脚'}
            </motion.button>

            <AnimatePresence>
              {showKickMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 glass rounded-xl p-2 z-30 min-w-[180px] max-h-[200px] overflow-y-auto"
                >
                  <div className="text-[10px] text-txt-muted mb-1 text-center px-1 pb-1 border-b border-white/[0.06]">
                    一脚 = {baseBlind}
                  </div>
                  {Array.from({ length: maxKicks }, (_, i) => i + 1).map((n, idx) => {
                    const kickAdd = Math.min(n * baseBlind, pot - currentBet)
                    const newBetAfterKick = currentBet + kickAdd
                    return (
                      <button
                        key={n}
                        onClick={() => { actions.kick(n); setShowKickMenu(false) }}
                        className={`flex items-center justify-between w-full px-3 py-2 text-[12px] text-txt rounded-lg hover:bg-white/[0.06] transition-colors ${idx > 0 ? 'border-t border-white/[0.04]' : ''}`}
                      >
                        <span>踢{kickNames[n - 1] || n}脚</span>
                        <span className="text-gold tabular-nums ml-3 text-[11px]">+{kickAdd} → {newBetAfterKick}</span>
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 恰提 / 带上 */}
          <motion.button
            whileTap={!canCallBet ? {} : { scale: 0.96 }}
            onClick={() => canCallBet && actions.callBet()}
            className={btnStyle('accent', !canCallBet)}
          >
            {canCallBet ? `${callBetLabel} ${callBetAmount}` : callBetLabel}
          </motion.button>
        </div>

        {/* Row 2: 弃牌 + 开牌 */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <motion.button
            whileTap={!canFold ? {} : { scale: 0.96 }}
            onClick={() => canFold && actions.fold()}
            className={btnStyle('danger', !canFold)}
          >
            弃牌
          </motion.button>
          <motion.button
            whileTap={!canShowdown ? {} : { scale: 0.96 }}
            onClick={() => canShowdown && actions.showdown()}
            className={btnStyle('purple', !canShowdown)}
          >
            {alreadyWantsOpen ? '已开牌' : '开牌'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
