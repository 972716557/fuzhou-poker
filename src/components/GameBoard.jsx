import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../game/GameContext.jsx'
import PlayerSeat from './PlayerSeat.jsx'
import ControlPanel from './ControlPanel.jsx'
import GameLog from './GameLog.jsx'
import DealingAnimation from './DealingAnimation.jsx'
import Card from './Card.jsx'
import { PHASE } from '../../shared/constants.js'

const MOBILE_BP = 768

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

  const isMobile = tableWidth < MOBILE_BP
  const layout = useMemo(() => ({
    tableRatio: isMobile ? 0.74 : 0.88,
    topPad: isMobile ? 44 : 52,
    botPad: isMobile ? 110 : 160,
  }), [isMobile])

  const phase = gameState?.phase || PHASE.WAITING
  const players = gameState?.players || []
  const pot = gameState?.pot || 0
  const roundNumber = gameState?.roundNumber || 0
  const remainingDeckCount = gameState?.remainingDeckCount ?? null
  const isDealing = !!dealingInfo && phase === PHASE.DEALING

  const displayPlayers = players.length > 0 ? players : roomState.playerList.map((p, i) => ({
    ...p, seatIndex: i, hand: null, hasFolded: false, currentBet: 0, isActive: true,
  }))

  const myIndex = displayPlayers.findIndex(p => p.id === roomState.playerId)
  const effectiveMyIndex = myIndex >= 0 ? myIndex : 0

  const seatPositions = useMemo(
    () => calculateSeatPositions(Math.max(displayPlayers.length, 1), tableWidth, tableHeight, effectiveMyIndex, layout),
    [displayPlayers.length, tableWidth, tableHeight, effectiveMyIndex, layout],
  )

  const [copied, setCopied] = useState(false)
  const handleCopyRoomId = () => {
    navigator.clipboard?.writeText(roomState.roomId || '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-surface min-h-0">
      {/* Table */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ paddingTop: layout.topPad, paddingBottom: layout.botPad }}
      >
        <div
          className="rounded-[50%]"
          style={{
            width: tableWidth * layout.tableRatio,
            height: '100%',
            background: 'radial-gradient(ellipse at center, #1a6b35 0%, #145528 50%, #0e3a1a 100%)',
            border: '1.5px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 0 80px rgba(20, 85, 40, 0.2), inset 0 0 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(42, 122, 62, 0.3)',
          }}
        >
          <div className="flex flex-col items-center justify-center h-full">
            {phase !== PHASE.WAITING && !isDealing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center"
              >
                <div className="text-white/25 text-[11px] font-medium tracking-wider uppercase mb-2">
                  Round {roundNumber}
                </div>
                <div className="text-white/30 text-[10px] font-medium mb-0.5">底池</div>
                <motion.div
                  key={pot}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-3xl md:text-4xl font-bold text-gold-light tabular-nums"
                  style={{ textShadow: '0 0 24px rgba(232, 197, 106, 0.3)' }}
                >
                  {pot}
                </motion.div>
                {remainingDeckCount !== null && (
                  <div className="text-white/20 text-[10px] mt-2 tabular-nums">
                    余牌 {remainingDeckCount}
                  </div>
                )}
                {/* Subtle divider line */}
                <div className="w-8 h-px bg-white/8 mt-2" />
              </motion.div>
            )}

            {phase === PHASE.WAITING && (
              <div className="text-center px-4">
                <div className="text-2xl md:text-3xl font-bold text-white/15 mb-1.5">抚州32张</div>
                <div className="text-sm text-white/10">
                  {displayPlayers.length} 位玩家
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My hand */}
      {!isDealing && phase !== PHASE.WAITING && myPlayer && !isSpectator && (
        <div
          className="absolute left-1/2 flex gap-2 justify-center items-center z-[5]"
          style={{ top: '75%', transform: 'translate(-50%, -50%)' }}
        >
          {myPlayer.hand && myPlayer.hand.length === 2 ? (
            <>
              <Card card={myPlayer.hand[0]} small={!isMobile} tiny={isMobile} delay={0} />
              <Card card={myPlayer.hand[1]} small={!isMobile} tiny={isMobile} delay={0.1} />
            </>
          ) : (
            <>
              <Card faceDown small={!isMobile} tiny={isMobile} delay={0} />
              <Card faceDown small={!isMobile} tiny={isMobile} delay={0.1} />
            </>
          )}
        </div>
      )}

      {/* Seats */}
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

      {/* Dealing */}
      {isDealing && <DealingAnimation seatPositions={seatPositions} />}

      {/* Controls */}
      <ControlPanel />

      {/* Log */}
      <GameLog />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 safe-top flex items-center justify-center gap-3 px-3 pt-2.5 md:px-5 md:pt-3 z-10">
        {/* Status pill */}
        <div className="glass-dark rounded-full px-2.5 py-1 flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            isDealing ? 'bg-blue-400 animate-pulse' :
            phase === PHASE.BETTING ? 'bg-accent animate-pulse' :
            phase === PHASE.SETTLEMENT ? 'bg-warn' :
            'bg-txt-muted'
          }`} />
          <span className="text-txt-muted text-[10px]">
            {phase === PHASE.WAITING && '等待'}
            {phase === PHASE.DEALING && '发牌'}
            {phase === PHASE.BETTING && '下注'}
            {phase === PHASE.SHOWDOWN && '摊牌'}
            {phase === PHASE.SETTLEMENT && '结算'}
          </span>
          {!connected && (
            <span className="text-danger text-[10px] animate-pulse">
              {connectionState === 'reconnecting' ? '重连' : '断线'}
            </span>
          )}
        </div>

        {/* Room ID pill */}
        {roomState.roomId && (
          <button
            onClick={handleCopyRoomId}
            className="glass-dark rounded-full px-3 py-1 flex items-center gap-1.5 hover:bg-white/5 transition-colors"
          >
            <span className="text-gold font-mono font-bold text-xs tracking-widest">{roomState.roomId}</span>
            <span className="text-txt-muted text-[10px]">{copied ? '已复制' : '复制'}</span>
          </button>
        )}
      </div>

      {/* Spectator */}
      {isSpectator && (
        <div className="absolute top-14 md:top-14 left-1/2 -translate-x-1/2 z-10">
          <div className="glass-dark rounded-full text-blue-400 text-[11px] font-medium px-3.5 py-1.5">
            旁观中 · 下一局自动加入
          </div>
        </div>
      )}

      {/* Leave */}
      <button
        onClick={actions.leaveRoom}
        className="absolute left-2 bottom-2 safe-bottom glass-dark rounded-full px-3 py-1.5 text-txt-muted hover:text-txt-secondary text-[11px] transition-colors z-10 min-h-[32px]"
      >
        离开
      </button>
    </div>
  )
}
