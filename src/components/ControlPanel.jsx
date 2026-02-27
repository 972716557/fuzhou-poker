import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/GameContext.jsx'
import { PHASE } from '../../shared/constants.js'

export default function ControlPanel() {
  const { gameState, roomState, myPlayer, isMyTurn, isSpectator, actions } = useGame()

  const [showCompareMenu, setShowCompareMenu] = useState(false)

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

  const canCompare = bettingRound >= (config.minRoundsToCompare || 3)
  const betAmount = currentBet
  const callBetAmount = currentBet * 2

  const compareTargets = players.filter(
    p => p.id !== roomState.playerId && p.isActive && !p.hasFolded
  )

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
      <div className="text-center mb-2">
        <span className="text-yellow-300 text-sm font-bold">你的回合</span>
        <span className="text-gray-400 text-xs ml-2">
          (第 {bettingRound} 轮 | 跟注额: {betAmount})
        </span>
      </div>

      <div className="flex gap-2 bg-black/70 backdrop-blur rounded-xl px-4 py-3 shadow-2xl">
        {/* 跟注 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={actions.bet}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 font-bold text-sm"
        >
          跟注 {betAmount}
        </motion.button>

        {/* 叫牌 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={actions.callBet}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 font-bold text-sm"
        >
          叫牌 {callBetAmount}
        </motion.button>

        {/* 比牌 */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: canCompare ? 1.05 : 1 }}
            whileTap={{ scale: canCompare ? 0.95 : 1 }}
            onClick={() => canCompare && setShowCompareMenu(!showCompareMenu)}
            className={`px-4 py-2 rounded-lg font-bold text-sm ${
              canCompare
                ? 'bg-purple-600 text-white hover:bg-purple-500'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            比牌
          </motion.button>

          <AnimatePresence>
            {showCompareMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 rounded-lg shadow-xl border border-gray-700 p-2 min-w-[120px]"
              >
                <div className="text-xs text-gray-400 mb-1 text-center">选择对手</div>
                {compareTargets.map((target) => (
                  <button
                    key={target.id}
                    onClick={() => {
                      actions.compare(target.id)
                      setShowCompareMenu(false)
                    }}
                    className="block w-full text-left px-3 py-1.5 text-sm text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    {target.avatar} {target.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 弃牌 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={actions.fold}
          className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 font-bold text-sm"
        >
          弃牌
        </motion.button>

        {/* 摊牌 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={actions.showdown}
          className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-xs"
        >
          摊牌
        </motion.button>
      </div>
    </div>
  )
}
