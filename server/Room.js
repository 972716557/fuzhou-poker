import { S2C, C2S } from '../shared/protocol.js'
import { PHASE } from '../shared/constants.js'
import { GameEngine } from './GameEngine.js'

export class Room {
  constructor(id, hostPlayer, roomManager) {
    this.id = id
    this.roomManager = roomManager
    this.hostId = hostPlayer.id
    this.players = new Map()       // playerId -> Player (已入座)
    this.spectators = new Map()    // playerId -> Player (旁观者)
    this.seatOrder = []            // playerId[] 座位顺序
    this.engine = new GameEngine()
    this.maxPlayers = 16
    this.dealAnimReady = new Set()
    this.dealAnimTimer = null
    this.disconnectTimers = new Map()
  }

  addPlayer(player) {
    if (this.engine.isRoundActive()) {
      // 对局进行中 → 旁观者
      player.isSpectator = true
      this.spectators.set(player.id, player)
    } else {
      if (this.players.size >= this.maxPlayers) {
        player.send({ type: S2C.ROOM_ERROR, payload: { message: '房间已满' } })
        return false
      }
      player.seatIndex = this.seatOrder.length
      this.seatOrder.push(player.id)
      this.players.set(player.id, player)
    }

    this.broadcastPlayerList()
    this.broadcast({ type: S2C.PLAYER_JOINED, payload: { player: player.toPublicView() } })

    // 如果正在对局，给新旁观者发当前状态
    if (this.engine.isRoundActive()) {
      this.sendGameStateTo(player)
    }
    return true
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId) || this.spectators.get(playerId)
    if (!player) return

    this.spectators.delete(playerId)

    if (this.players.has(playerId)) {
      this.players.delete(playerId)
      this.seatOrder = this.seatOrder.filter(id => id !== playerId)

      // 如果是当前操作者，自动弃牌
      if (this.engine.getCurrentPlayerId() === playerId && this.engine.phase === PHASE.BETTING) {
        player.hasFolded = true
        player.isActive = false
        this.engine.addLog(`${player.name} 离开了房间，自动弃牌`)

        // 检查是否只剩一人
        const active = this.engine.getActivePlayers()
        if (active.length <= 1 && this.engine.phase === PHASE.BETTING) {
          const winner = active[0]
          if (winner) {
            const allPlayers = this.engine.players.filter(p => p.totalBet > 0)
            const awarded = this.engine.settleSidePot(winner, allPlayers)
            for (const p of allPlayers) {
              if (p.totalBet > 0) {
                p.chips += p.totalBet
                this.engine.addLog(`${p.name} 退还 ${p.totalBet}（超出赢家上限）`)
                p.totalBet = 0
              }
            }
            this.engine.winnerId = winner.id
            this.engine.addLog(`${winner.name} 赢得 ${awarded}！`)
          }
          this.engine.pot = 0
          this.engine.phase = PHASE.SETTLEMENT
        } else {
          // 移到下一个人
          const idx = this.engine.players.findIndex(p => p.id === playerId)
          if (idx !== -1) {
            this.engine.currentPlayerIndex = this.engine.getNextActiveIndex(idx)
          }
        }
      }

      // 重新给引擎设置座位编号
      this.seatOrder.forEach((pid, i) => {
        const p = this.players.get(pid)
        if (p) p.seatIndex = i
      })
    }

    // 如果房主走了，转移房主
    if (playerId === this.hostId && this.seatOrder.length > 0) {
      this.hostId = this.seatOrder[0]
    }

    this.broadcast({ type: S2C.PLAYER_LEFT, payload: { playerId } })
    this.broadcastPlayerList()

    if (this.engine.isRoundActive()) {
      this.broadcastGameState()
    }

    // 空房间清理
    if (this.players.size === 0 && this.spectators.size === 0) {
      this.roomManager.removeRoom(this.id)
    }
  }

  promoteSpectators() {
    for (const [id, spectator] of this.spectators) {
      if (this.players.size >= this.maxPlayers) break
      spectator.isSpectator = false
      spectator.seatIndex = this.seatOrder.length
      this.seatOrder.push(id)
      this.players.set(id, spectator)
      this.spectators.delete(id)
    }
  }

  handleDisconnect(playerId) {
    const player = this.players.get(playerId) || this.spectators.get(playerId)
    if (!player) return
    player.isConnected = false
    player.ws = null

    this.broadcast({ type: S2C.PLAYER_DISCONNECTED, payload: { playerId } })

    // 如果是当前操作者，10秒后自动弃牌
    if (this.engine.getCurrentPlayerId() === playerId && this.engine.phase === PHASE.BETTING) {
      const timer = setTimeout(() => {
        if (!player.isConnected) {
          this.engine.processAction(playerId, C2S.PLAYER_FOLD, {})
          this.broadcastGameState()
        }
      }, 10000)
      this.disconnectTimers.set(playerId, timer)
    }
  }

  handleReconnect(playerId, ws) {
    const player = this.players.get(playerId) || this.spectators.get(playerId)
    if (!player) return false
    player.ws = ws
    player.isConnected = true

    // 取消自动弃牌
    const timer = this.disconnectTimers.get(playerId)
    if (timer) {
      clearTimeout(timer)
      this.disconnectTimers.delete(playerId)
    }

    this.broadcast({ type: S2C.PLAYER_RECONNECTED, payload: { playerId } })
    this.sendGameStateTo(player)
    this.broadcastPlayerList()
    return true
  }

  handleMessage(ws, msg) {
    const player = this.findPlayerByWs(ws)
    if (!player) return

    switch (msg.type) {
      case C2S.START_GAME:
      case C2S.NEXT_ROUND: {
        if (player.id !== this.hostId) return
        if (this.players.size < 2) {
          player.send({ type: S2C.ERROR, payload: { message: '至少需要2名玩家' } })
          return
        }
        this.promoteSpectators()
        this.startRound()
        break
      }

      case C2S.PLAYER_BET:
      case C2S.PLAYER_RAISE:
      case C2S.PLAYER_CALL_BET:
      case C2S.PLAYER_KICK:
      case C2S.PLAYER_FOLD:
      case C2S.PLAYER_SHOWDOWN: {
        if (player.isSpectator) return
        this.engine.processAction(player.id, msg.type, msg.payload || {})
        this.broadcastGameState()
        break
      }

      case C2S.DEAL_ANIM_DONE: {
        this.dealAnimReady.add(player.id)
        this.checkAllAnimDone()
        break
      }

      case C2S.LEAVE_ROOM: {
        this.removePlayer(player.id)
        break
      }
    }
  }

  startRound() {
    // 设置引擎玩家列表
    const playerList = this.seatOrder.map(id => this.players.get(id)).filter(Boolean)
    this.engine.setPlayers(playerList)

    this.dealAnimReady.clear()
    if (this.dealAnimTimer) clearTimeout(this.dealAnimTimer)

    const dealInfo = this.engine.startRound()
    this.broadcast({ type: S2C.DEAL_START, payload: dealInfo })

    // 15秒超时保护
    this.dealAnimTimer = setTimeout(() => {
      if (this.engine.phase === PHASE.DEALING) {
        this.engine.completeDeal()
        this.sendDealComplete()
        this.broadcastGameState()
      }
    }, 15000)
  }

  checkAllAnimDone() {
    const connectedPlayers = [...this.players.values()].filter(p => p.isConnected)
    if (this.dealAnimReady.size >= connectedPlayers.length) {
      if (this.dealAnimTimer) clearTimeout(this.dealAnimTimer)
      this.engine.completeDeal()
      this.sendDealComplete()
      this.broadcastGameState()
    }
  }

  sendDealComplete() {
    for (const player of this.players.values()) {
      player.send({
        type: S2C.DEAL_COMPLETE,
        payload: { yourHand: player.hand },
      })
    }
    for (const spec of this.spectators.values()) {
      spec.send({
        type: S2C.DEAL_COMPLETE,
        payload: { yourHand: null },
      })
    }
  }

  broadcastGameState() {
    for (const player of [...this.players.values(), ...this.spectators.values()]) {
      if (player.isConnected) this.sendGameStateTo(player)
    }
  }

  sendGameStateTo(player) {
    const state = this.engine.getState()
    const isReveal = state.phase === PHASE.SHOWDOWN || state.phase === PHASE.SETTLEMENT

    const tailoredPlayers = this.seatOrder.map(pid => {
      const p = this.players.get(pid)
      if (!p) return null
      if (pid === player.id || isReveal) return p.toPrivateView()
      return p.toPublicView()
    }).filter(Boolean)

    player.send({
      type: S2C.GAME_STATE,
      payload: {
        ...state,
        yourPlayerId: player.id,
        yourHand: player.hand,
        isSpectator: player.isSpectator,
        players: tailoredPlayers,
        spectators: [...this.spectators.values()].map(s => ({
          id: s.id, name: s.name, avatar: s.avatar,
        })),
      },
    })
  }

  broadcastPlayerList() {
    const list = {
      type: S2C.PLAYER_LIST,
      payload: {
        players: this.seatOrder.map(id => {
          const p = this.players.get(id)
          return p ? { id: p.id, name: p.name, avatar: p.avatar, chips: p.chips, isConnected: p.isConnected } : null
        }).filter(Boolean),
        hostId: this.hostId,
        spectators: [...this.spectators.values()].map(s => ({
          id: s.id, name: s.name, avatar: s.avatar,
        })),
      },
    }
    this.broadcast(list)
  }

  broadcast(msg) {
    for (const p of [...this.players.values(), ...this.spectators.values()]) {
      p.send(msg)
    }
  }

  findPlayerByWs(ws) {
    for (const p of this.players.values()) {
      if (p.ws === ws) return p
    }
    for (const p of this.spectators.values()) {
      if (p.ws === ws) return p
    }
    return null
  }
}
