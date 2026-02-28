import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../game/GameContext.jsx'
import PlayerSeat from './PlayerSeat.jsx'
import ControlPanel from './ControlPanel.jsx'
import GameLog from './GameLog.jsx'
import DealingAnimation from './DealingAnimation.jsx'
import Card from './Card.jsx'
import { PHASE } from '../../shared/constants.js'

const MOBILE_BREAKPOINT = 768

/**
 * 座位在桌子边缘（与绿色椭圆边界重合）
 * 椭圆与桌面 div 同尺寸：宽 width*tableRatio，高 availH
 * 手机端缩小 tableRatio 和 padding，保证左右玩家不超出视口
 */
function calculateSeatPositions(count, width, height, myIndex, { tableRatio, topPad, botPad }) {
  const availH = height - topPad - botPad
  const centerX = width / 2
  const centerY = topPad + availH / 2
  const radiusX = (width * tableRatio) / 2
  const radiusY = availH / 2

  const myAngle = Math.PI / 2
  const positions = new Array(count)
  for (let i = 0; i < count; i++) {
    const offset = (i - myIndex + count) % count
    const angle = myAngle + (2 * Math.PI * offset) / count
    positions[i] = {
      x: centerX + radiusX * Math.cos(angle),
      y: centerY + radiusY * Math.sin(angle),
    }
  }
  return positions
}

function useWindowSize() {
  const [size, setSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }))
  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

export default function GameBoard() {
  const { gameState, roomState, dealingInfo, connected, connectionState, actions, isSpectator, myPlayer } = useGame()
  const { width: tableWidth, height: tableHeight } = useWindowSize()

  const isMobile = tableWidth < MOBILE_BREAKPOINT
  const layout = useMemo(() => ({
    tableRatio: isMobile ? 0.72 : 0.92,
    topPad: isMobile ? 48 : 56,
    botPad: isMobile ? 120 : 180,
  }), [isMobile])
  const TABLE_BOTTOM_PAD = layout.botPad

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

  // 找自己在列表中的位置，用于把自己固定在底部
  const myIndex = displayPlayers.findIndex(p => p.id === roomState.playerId)
  const effectiveMyIndex = myIndex >= 0 ? myIndex : 0

  const seatPositions = useMemo(
    () => calculateSeatPositions(Math.max(displayPlayers.length, 1), tableWidth, tableHeight, effectiveMyIndex, layout),
    [displayPlayers.length, tableWidth, tableHeight, effectiveMyIndex, layout],
  )

  const handleCopyRoomId = () => {
    navigator.clipboard?.writeText(roomState.roomId || '').then(() => {
      const btn = document.querySelector('[data-copy-room-btn]')
      if (btn) {
        const orig = btn.textContent
        btn.textContent = '已复制'
        setTimeout(() => { btn.textContent = orig }, 1500)
      }
    }).catch(() => {})
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900 min-h-0">
      {/* 背景桌面：PC 大椭圆，手机端缩小保证左右玩家不溢出 */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: layout.topPad, paddingBottom: TABLE_BOTTOM_PAD }}>
        <div
          className="rounded-[50%] border-4 border-amber-900/60 shadow-2xl"
          style={{
            width: tableWidth * layout.tableRatio,
            height: '100%',
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

      {/* 我的手牌：放在桌面上（底池下方），节省底部空间 */}
      {!isDealing && phase !== PHASE.WAITING && myPlayer && !isSpectator && (
        <div
          className="absolute left-1/2 flex gap-1.5 justify-center items-center z-[5]"
          style={{ top: '68%', transform: 'translate(-50%, -50%)' }}
        >
          {myPlayer.hand && myPlayer.hand.length === 2 ? (
            <>
              <Card card={myPlayer.hand[0]} small tiny={isMobile} delay={0} />
              <Card card={myPlayer.hand[1]} small tiny={isMobile} delay={0.1} />
            </>
          ) : (
            <>
              <Card faceDown small tiny={isMobile} delay={0} />
              <Card faceDown small tiny={isMobile} delay={0.1} />
            </>
          )}
        </div>
      )}

      {/* 玩家座位 */}
      {displayPlayers.map((player, index) => (
        <PlayerSeat
          key={player.id}
          player={player}
          index={index}
          position={seatPositions[index]}
          isCurrentTurn={phase === PHASE.BETTING && gameState?.currentPlayerId === player.id}
          compact={isMobile}
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
              type="button"
              data-copy-room-btn
              onClick={handleCopyRoomId}
              className="text-gray-500 hover:text-white text-xs transition whitespace-nowrap"
              title="复制房间号"
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

      {/* 离开房间：放在操作栏上方，不占栏内 */}
      <button
        onClick={actions.leaveRoom}
        className="absolute left-2 text-gray-500 hover:text-gray-400 text-xs transition z-10"
        style={{ bottom: 12 }}
      >
        离开房间
      </button>
    </div>
  )
}
