import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useWebSocket } from '../hooks/useWebSocket.js'
import { C2S, S2C } from '../../shared/protocol.js'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const { connected, connectionState, send, onMessage } = useWebSocket()

  // 房间状态
  const [roomState, setRoomState] = useState({
    roomId: null,
    playerId: null,
    isHost: false,
    inLobby: true,
    playerList: [],
    spectatorList: [],
    hostId: null,
    error: null,
  })

  // 游戏状态（来自服务端 GAME_STATE）
  const [gameState, setGameState] = useState(null)

  // 发牌动画数据（来自服务端 DEAL_START）
  const [dealingInfo, setDealingInfo] = useState(null)

  // 消息监听
  useEffect(() => {
    return onMessage('game_context', (msg) => {
      switch (msg.type) {
        case S2C.ROOM_CREATED:
          sessionStorage.setItem('fuzhou_reconnect', JSON.stringify(msg.payload))
          setRoomState(prev => ({
            ...prev,
            roomId: msg.payload.roomId,
            playerId: msg.payload.playerId,
            isHost: true,
            inLobby: false,
            error: null,
          }))
          break

        case S2C.ROOM_JOINED:
          sessionStorage.setItem('fuzhou_reconnect', JSON.stringify(msg.payload))
          setRoomState(prev => ({
            ...prev,
            roomId: msg.payload.roomId,
            playerId: msg.payload.playerId,
            isHost: prev.isHost, // 保持（重连时保留）
            inLobby: false,
            error: null,
          }))
          break

        case S2C.ROOM_ERROR:
          setRoomState(prev => ({ ...prev, error: msg.payload.message }))
          sessionStorage.removeItem('fuzhou_reconnect')
          break

        case S2C.PLAYER_LIST:
          setRoomState(prev => ({
            ...prev,
            playerList: msg.payload.players,
            spectatorList: msg.payload.spectators,
            hostId: msg.payload.hostId,
            isHost: prev.playerId === msg.payload.hostId,
          }))
          break

        case S2C.GAME_STATE:
          setGameState(msg.payload)
          // 当进入 BETTING 阶段，清除发牌动画
          if (msg.payload.phase === 'BETTING' || msg.payload.phase === 'SETTLEMENT' || msg.payload.phase === 'WAITING') {
            setDealingInfo(null)
          }
          break

        case S2C.DEAL_START:
          setDealingInfo(msg.payload)
          break

        case S2C.DEAL_COMPLETE:
          // 手牌已在 GAME_STATE 中更新
          break

        case S2C.PLAYER_JOINED:
        case S2C.PLAYER_LEFT:
        case S2C.PLAYER_DISCONNECTED:
        case S2C.PLAYER_RECONNECTED:
          // player_list 消息会随后到来更新列表
          break

        case S2C.ERROR:
          console.warn('Server error:', msg.payload.message)
          break
      }
    })
  }, [onMessage])

  // ---- Action 函数 ----

  const createRoom = useCallback((name, avatar) => {
    send({ type: C2S.CREATE_ROOM, payload: { playerName: name, avatar } })
  }, [send])

  const joinRoom = useCallback((roomId, name, avatar) => {
    send({ type: C2S.JOIN_ROOM, payload: { roomId, playerName: name, avatar } })
  }, [send])

  const leaveRoom = useCallback(() => {
    send({ type: C2S.LEAVE_ROOM, payload: {} })
    sessionStorage.removeItem('fuzhou_reconnect')
    setRoomState({ roomId: null, playerId: null, isHost: false, inLobby: true, playerList: [], spectatorList: [], hostId: null, error: null })
    setGameState(null)
    setDealingInfo(null)
  }, [send])

  const startGame = useCallback(() => {
    send({ type: C2S.START_GAME, payload: {} })
  }, [send])

  const nextRound = useCallback(() => {
    send({ type: C2S.NEXT_ROUND, payload: {} })
  }, [send])

  const look = useCallback(() => {
    send({ type: C2S.PLAYER_LOOK, payload: {} })
  }, [send])

  const bet = useCallback(() => {
    send({ type: C2S.PLAYER_BET, payload: {} })
  }, [send])

  const raise = useCallback((amount) => {
    send({ type: C2S.PLAYER_RAISE, payload: { amount } })
  }, [send])

  const fold = useCallback(() => {
    send({ type: C2S.PLAYER_FOLD, payload: {} })
  }, [send])

  const compare = useCallback((targetPlayerId) => {
    send({ type: C2S.PLAYER_COMPARE, payload: { targetPlayerId } })
  }, [send])

  const showdown = useCallback(() => {
    send({ type: C2S.PLAYER_SHOWDOWN, payload: {} })
  }, [send])

  const dealAnimDone = useCallback(() => {
    send({ type: C2S.DEAL_ANIM_DONE, payload: {} })
  }, [send])

  // 派生便利属性
  const myPlayer = gameState?.players?.find(p => p.id === roomState.playerId) || null
  const isMyTurn = gameState?.currentPlayerId === roomState.playerId
  const isSpectator = gameState?.isSpectator || false

  const value = {
    connected,
    connectionState,
    roomState,
    gameState,
    dealingInfo,
    myPlayer,
    isMyTurn,
    isSpectator,
    actions: {
      createRoom,
      joinRoom,
      leaveRoom,
      startGame,
      nextRound,
      look,
      bet,
      raise,
      fold,
      compare,
      showdown,
      dealAnimDone,
    },
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
