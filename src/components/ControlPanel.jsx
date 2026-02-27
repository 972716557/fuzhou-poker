import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/GameContext.jsx'
import { PHASE } from '../../shared/constants.js'

export default function ControlPanel() {
  const { gameState, roomState, myPlayer, isMyTurn, isSpectator, actions } = useGame()

  const [showKickMenu, setShowKickMenu] = useState(false)

  const phase = gameState?.phase || PHASE.WAITING
  const players = gameState?.players || []
  const currentBet = gameState?.currentBet || 0
  const bettingRound = gameState?.bettingRound || 0
  const config = gameState?.config || {}
  const isHost = roomState.isHost

  // 发牌阶段不显示
  if (phase === PHASE.DEALING) return null

  // 旁观者不操作
  if (isSpectator) return null

  // 等待开始
  if (phase === PHASE.WAITING) {
    const playerCount = roomState.playerList.length
    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <div className="text-gray-400 text-sm">
          {playerCount} 人在房间
          {playerCount < 2 && <span className="text-yellow-400 ml-2">（至少需要2人）</span>}
        </div>
        {isHost ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={actions.startGame}
            disabled={playerCount < 2}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl shadow-lg hover:from-green-500 hover:to-green-600 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            开始游戏
          </motion.button>
        ) : (
          <div className="text-gray-500 text-sm">等待房主开始...</div>
        )}
      </div>
    )
  }

  // 结算
  if (phase === PHASE.SETTLEMENT) {
    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        {isHost ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={actions.nextRound}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl shadow-lg hover:from-green-500 hover:to-green-600 text-lg"
          >
            下一局
          </motion.button>
        ) : (
          <div className="text-gray-500 text-sm">等待房主开始下一局...</div>
        )}
      </div>
    )
  }

  // 下注阶段 - 只有轮到自己才显示操作按钮
  if (phase !== PHASE.BETTING) return null

  if (!isMyTurn || !myPlayer) {
    const currentPlayer = players.find(p => p.id === gameState?.currentPlayerId)
    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="bg-black/50 backdrop-blur rounded-xl px-4 py-2">
          <span className="text-gray-400 text-sm">
            等待 <span className="text-yellow-300">{currentPlayer?.name || '...'}</span> 操作
          </span>
        </div>
      </div>
    )
  }

  const betAmount = currentBet
  const callBetAmount = currentBet * 2
  const pot = gameState?.pot || 0
  const maxKicks = currentBet > 0 ? Math.floor(pot / currentBet) : 0
  const canKick = maxKicks >= 1

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-16px)] max-w-sm z-10">
      <div className="text-center mb-1">
        <span className="text-yellow-300 text-xs font-bold">你的回合</span>
        <span className="text-gray-400 text-xs ml-2">
          第 {bettingRound} 轮 · 跟注 {betAmount}
        </span>
      </div>

      <div className="bg-black/80 backdrop-blur rounded-xl px-3 py-2 shadow-2xl flex flex-col gap-1.5">
        {/* 第一行：跟注 + 叫牌 + 弃牌 */}
        <div className="flex gap-1.5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={actions.bet}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold text-sm active:bg-green-500"
          >
            跟注 {betAmount}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={actions.callBet}
            className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold text-sm active:bg-orange-500"
          >
            叫牌 {callBetAmount}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={actions.fold}
            className="flex-1 py-2 bg-red-700 text-white rounded-lg font-bold text-sm active:bg-red-600"
          >
            弃牌
          </motion.button>
        </div>

        {/* 第二行：踢 + 比牌 + 摊牌 */}
        <div className="flex gap-1.5">
          {/* 踢 */}
          <div className="relative flex-1">
            <motion.button
              whileTap={{ scale: canKick ? 0.95 : 1 }}
              onClick={() => {
                if (canKick) {
                  setShowKickMenu(!showKickMenu)
                  setShowCompareMenu(false)
                }
              }}
              className={`w-full py-2 rounded-lg font-bold text-sm ${
                canKick
                  ? 'bg-amber-600 text-white active:bg-amber-500'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              踢一脚
            </motion.button>

            <AnimatePresence>
              {showKickMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-2 left-0 bg-gray-900 rounded-lg shadow-xl border border-gray-700 p-2 min-w-[140px] max-h-[200px] overflow-y-auto z-30"
                >
                  <div className="text-xs text-gray-400 mb-1 text-center">踢几脚？</div>
                  {Array.from({ length: Math.min(maxKicks, 10) }, (_, i) => i + 1).map((n) => {
                    const kickPayAmount = currentBet + n * currentBet
                    const kickNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
                    return (
                      <button
                        key={n}
                        onClick={() => {
                          actions.kick(n)
                          setShowKickMenu(false)
                        }}
                        className="block w-full text-left px-3 py-1.5 text-sm text-white hover:bg-gray-700 rounded transition-colors"
                      >
                        踢{kickNames[n - 1] || n}脚 <span className="text-amber-400">({kickPayAmount})</span>
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 亮牌 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={actions.showdown}
            className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm active:bg-purple-500"
          >
            亮牌
          </motion.button>

        </div>
      </div>
    </div>
  )
}
