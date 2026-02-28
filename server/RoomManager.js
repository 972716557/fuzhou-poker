import crypto from 'crypto'
import { C2S, S2C } from '../shared/protocol.js'
import { Player } from './Player.js'
import { Room } from './Room.js'

const ROOM_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

// 生产环境：一设备一身份；本地联调不限制
const enforceDeviceLimit = process.env.NODE_ENV === 'production'

export class RoomManager {
  constructor() {
    this.rooms = new Map()         // roomId -> Room
    this.playerRooms = new Map()   // playerId -> roomId
    this.wsPlayers = new WeakMap() // ws -> playerId
    // 生产环境：deviceId -> { playerId, roomId, token }；playerId -> deviceId（用于离场时清理）
    this.deviceIdToPlayer = new Map()
    this.playerToDeviceId = new Map()
  }

  generateRoomId() {
    let id
    do {
      id = Array.from({ length: 4 }, () => ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)]).join('')
    } while (this.rooms.has(id))
    return id
  }

  generatePlayerId() {
    return 'p_' + crypto.randomUUID().slice(0, 8)
  }

  handleMessage(ws, msg) {
    switch (msg.type) {
      case C2S.CREATE_ROOM:
        return this.createRoom(ws, msg.payload || {})
      case C2S.JOIN_ROOM:
        return this.joinRoom(ws, msg.payload || {})
      case C2S.RECONNECT:
        return this.reconnect(ws, msg.payload || {})
      case C2S.PING:
        return this.sendTo(ws, { type: S2C.PONG, payload: {} })
      default: {
        // 已关联房间的消息，转发到对应 Room
        const playerId = this.wsPlayers.get(ws)
        if (playerId) {
          const roomId = this.playerRooms.get(playerId)
          const room = roomId ? this.rooms.get(roomId) : null
          if (room) room.handleMessage(ws, msg)
        }
      }
    }
  }

  handleDisconnect(ws) {
    const playerId = this.wsPlayers.get(ws)
    if (!playerId) return
    const roomId = this.playerRooms.get(playerId)
    const room = roomId ? this.rooms.get(roomId) : null
    if (room) room.handleDisconnect(playerId)
  }

  /** 生产环境：同一设备已占用的身份，用新连接顶掉旧连接（一设备一身份） */
  reclaimDevice(ws, deviceId) {
    const entry = this.deviceIdToPlayer.get(deviceId)
    if (!entry) return false
    const { playerId, roomId, token } = entry
    const room = this.rooms.get(roomId)
    if (!room) {
      this.deviceIdToPlayer.delete(deviceId)
      this.playerToDeviceId.delete(playerId)
      return false
    }
    const player = room.players.get(playerId) || room.spectators.get(playerId)
    if (!player || player.token !== token) return false

    const oldWs = player.ws
    if (oldWs && oldWs !== ws) {
      this.wsPlayers.delete(oldWs)
      oldWs.close()
    }

    this.wsPlayers.set(ws, playerId)
    ws.roomId = roomId
    ws.playerId = playerId
    room.handleReconnect(playerId, ws)

    this.sendTo(ws, {
      type: S2C.ROOM_JOINED,
      payload: { roomId, playerId, token: player.token, isSpectator: player.isSpectator },
    })
    console.log(`[Room ${roomId}] ${player.name} (${playerId}) 同设备重连 [deviceId]`)
    return true
  }

  /** 玩家离场时清理设备绑定（生产环境） */
  onPlayerLeft(playerId) {
    if (!enforceDeviceLimit) return
    const deviceId = this.playerToDeviceId.get(playerId)
    if (deviceId) {
      this.deviceIdToPlayer.delete(deviceId)
      this.playerToDeviceId.delete(playerId)
    }
  }

  createRoom(ws, { playerName, avatar, deviceId }) {
    if (enforceDeviceLimit && deviceId && this.deviceIdToPlayer.has(deviceId)) {
      if (this.reclaimDevice(ws, deviceId)) return
    }

    const roomId = this.generateRoomId()
    const playerId = this.generatePlayerId()
    const player = new Player(playerId, playerName || '房主', avatar || '👨', ws)

    const room = new Room(roomId, player, this)
    this.rooms.set(roomId, room)
    room.addPlayer(player)

    this.playerRooms.set(playerId, roomId)
    this.wsPlayers.set(ws, playerId)
    ws.roomId = roomId
    ws.playerId = playerId

    if (enforceDeviceLimit && deviceId) {
      this.deviceIdToPlayer.set(deviceId, { playerId, roomId, token: player.token })
      this.playerToDeviceId.set(playerId, deviceId)
    }

    player.send({
      type: S2C.ROOM_CREATED,
      payload: { roomId, playerId, token: player.token },
    })

    console.log(`[Room ${roomId}] Created by ${playerName} (${playerId})`)
  }

  joinRoom(ws, { roomId, playerName, avatar, deviceId }) {
    if (enforceDeviceLimit && deviceId && this.deviceIdToPlayer.has(deviceId)) {
      if (this.reclaimDevice(ws, deviceId)) return
    }

    const room = this.rooms.get(roomId?.toUpperCase())
    if (!room) {
      this.sendTo(ws, { type: S2C.ROOM_ERROR, payload: { message: `房间 ${roomId} 不存在` } })
      return
    }

    if (room.players.size >= room.maxPlayers && !room.engine.isRoundActive()) {
      this.sendTo(ws, { type: S2C.ROOM_ERROR, payload: { message: '房间已满' } })
      return
    }

    const playerId = this.generatePlayerId()
    const player = new Player(playerId, playerName || '玩家', avatar || '🧑', ws)

    room.addPlayer(player)

    this.playerRooms.set(playerId, roomId.toUpperCase())
    this.wsPlayers.set(ws, playerId)
    ws.roomId = roomId.toUpperCase()
    ws.playerId = playerId

    if (enforceDeviceLimit && deviceId) {
      this.deviceIdToPlayer.set(deviceId, { playerId, roomId: roomId.toUpperCase(), token: player.token })
      this.playerToDeviceId.set(playerId, deviceId)
    }

    player.send({
      type: S2C.ROOM_JOINED,
      payload: { roomId: roomId.toUpperCase(), playerId, token: player.token, isSpectator: player.isSpectator },
    })

    console.log(`[Room ${roomId}] ${playerName} (${playerId}) joined${player.isSpectator ? ' as spectator' : ''}`)
  }

  reconnect(ws, { roomId, playerId, token }) {
    const room = this.rooms.get(roomId)
    if (!room) {
      this.sendTo(ws, { type: S2C.ROOM_ERROR, payload: { message: '房间已不存在' } })
      return
    }

    const player = room.players.get(playerId) || room.spectators.get(playerId)
    if (!player || player.token !== token) {
      this.sendTo(ws, { type: S2C.ROOM_ERROR, payload: { message: '重连验证失败' } })
      return
    }

    this.wsPlayers.set(ws, playerId)
    ws.roomId = roomId
    ws.playerId = playerId
    room.handleReconnect(playerId, ws)

    player.send({
      type: S2C.ROOM_JOINED,
      payload: { roomId, playerId, token: player.token, isSpectator: player.isSpectator },
    })

    console.log(`[Room ${roomId}] ${player.name} (${playerId}) reconnected`)
  }

  removeRoom(roomId) {
    this.rooms.delete(roomId)
    // 清理 playerRooms 映射
    for (const [pid, rid] of this.playerRooms) {
      if (rid === roomId) this.playerRooms.delete(pid)
    }
    console.log(`[Room ${roomId}] Removed (empty)`)
  }

  sendTo(ws, msg) {
    if (ws.readyState === 1) ws.send(JSON.stringify(msg))
  }
}
