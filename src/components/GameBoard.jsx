import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../game/GameContext.jsx'
import PlayerSeat from './PlayerSeat.jsx'
import ControlPanel from './ControlPanel.jsx'
import GameLog from './GameLog.jsx'
import DealingAnimation from './DealingAnimation.jsx'
import { PHASE } from '../../shared/constants.js'

function calculateSeatPositions(count, width, height) {
  const positions = []
  const centerX = width / 2
  const centerY = height / 2
  const radiusX = width * 0.40
  const radiusY = height * 0.36
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    positions.push({
      x: centerX + radiusX * Math.cos(angle),
      y: centerY + radiusY * Math.sin(angle),
    })
  }
  return positions
}

export default function GameBoard() {
  const { gameState, roomState, dealingInfo, connected, connectionState, actions, isSpectator } = useGame()

  const tableWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
  const tableHeight = typeof window !== 'undefined' ? window.innerHeight : 800

  const phase = gameState?.phase || PHASE.WAITING
  const players = gameState?.players || []
  const pot = gameState?.pot || 0
  const roundNumber = gameState?.roundNumber || 0
  const isDealing = !!dealingInfo && phase === PHASE.DEALING

  // 等待阶段用 playerList，游戏阶段用 gameState.players
  const displayPlayers = players.length > 0 ? players : roomState.playerList.map((p, i) => ({
    ...p,
    seatIndex: i,
    hand: null,
    hasFolded: false,
    currentBet: 0,
    isActive: true,
  }))

  const seatPositions = useMemo(
    () => calculateSeatPositions(Math.max(displayPlayers.length, 1), tableWidth, tableHeight),
    [displayPlayers.length, tableWidth, tableHeight],
  )

  const handleCopyRoomId = () => {
    const url = `${window.location.origin}?room=${roomState.roomId}`
    navigator.clipboard?.writeText(url).catch(() => {})
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900">
      {/* 背景桌面 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-[50%] border-4 border-amber-900/60 shadow-2xl"
          style={{
            width: tableWidth * 0.75,
            height: tableHeight * 0.65,
            background: 'radial-gradient(ellipse at center, #1a6b35 0%, #145528 50%, #0f3d1d 100%)',
            boxShadow: '0 0 60px rgba(26, 92, 46, 0.3), inset 0 0 80px rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex flex-col items-center justify-center h-full">
            {phase !== PHASE.WAITING && !isDealing && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center"
              >
                <div className="text-amber-300/60 text-xs mb-1">第 {roundNumber} 局</div>
                <div className="text-xs text-gray-400 mb-1">底池</div>
                <motion.div
                  key={pot}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-3xl font-bold text-yellow-400"
                  style={{ textShadow: '0 0 20px rgba(234, 179, 8, 0.5)' }}
                >
                  ${pot}
                </motion.div>
                <div className="flex gap-0.5 mt-2">
                  {Array.from({ length: Math.min(Math.ceil(pot / 50), 10) }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="w-3 h-3 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 border border-yellow-300"
                      style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {phase === PHASE.WAITING && (
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-200/60 mb-2">抚州32张</div>
                <div className="text-sm text-emerald-400/40">
                  等待开始 | {displayPlayers.length} 人
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 玩家座位 */}
      {displayPlayers.map((player, index) => (
        <PlayerSeat
          key={player.id}
          player={player}
          index={index}
          position={seatPositions[index]}
          isCurrentTurn={phase === PHASE.BETTING && gameState?.currentPlayerId === player.id}
        />
      ))}

      {/* 发牌动画 */}
      {isDealing && (
        <DealingAnimation seatPositions={seatPositions} />
      )}

      {/* 控制面板 */}
      <ControlPanel />

      {/* 游戏日志 */}
      <GameLog />

      {/* 顶部状态栏 */}
      <div className="absolute top-2 left-2 flex items-center gap-3">
        {/* 连接状态 */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${
            isDealing ? 'bg-blue-400 animate-pulse' :
            phase === PHASE.BETTING ? 'bg-green-400 animate-pulse' :
            phase === PHASE.SETTLEMENT ? 'bg-yellow-400' :
            'bg-gray-500'
          }`} />
          <span className="text-gray-400 text-xs">
            {phase === PHASE.WAITING && '等待开始'}
            {phase === PHASE.DEALING && '发牌中'}
            {phase === PHASE.BETTING && '下注中'}
            {phase === PHASE.SHOWDOWN && '摊牌'}
            {phase === PHASE.SETTLEMENT && '结算'}
          </span>
        </div>

        {/* 网络状态 */}
        {!connected && (
          <span className="text-red-400 text-xs animate-pulse">
            {connectionState === 'reconnecting' ? '重连中...' : '断线'}
          </span>
        )}
      </div>

      {/* 房间号 + 分享 */}
      {roomState.roomId && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="bg-black/60 backdrop-blur px-3 py-1 rounded-full flex items-center gap-2">
            <span className="text-gray-400 text-xs">房间</span>
            <span className="text-yellow-300 font-mono font-bold tracking-widest">{roomState.roomId}</span>
            <button
              onClick={handleCopyRoomId}
              className="text-gray-500 hover:text-white text-xs transition"
              title="复制邀请链接"
            >
              复制
            </button>
          </div>
        </div>
      )}

      {/* 旁观者提示 */}
      {isSpectator && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2">
          <div className="bg-blue-900/60 text-blue-300 text-sm px-4 py-1.5 rounded-full">
            你正在旁观，下一局自动加入
          </div>
        </div>
      )}

      {/* 离开房间 */}
      <button
        onClick={actions.leaveRoom}
        className="absolute bottom-2 left-2 text-gray-600 hover:text-gray-400 text-xs transition"
      >
        离开房间
      </button>
    </div>
  )
}
