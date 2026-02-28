import crypto from 'crypto'

export class Player {
  constructor(id, name, avatar, ws) {
    this.id = id
    this.name = name
    this.avatar = avatar
    this.ws = ws
    this.token = crypto.randomUUID()
    this.chips = 1000
    this.isConnected = true
    this.isSpectator = false
    this.seatIndex = -1

    // 每局重置的状态
    this.hand = null
    this.hasFolded = false
    this.currentBet = 0
    this.totalBet = 0   // 本局累计出注（用于 side pot 结算）
    this.isActive = true
    this.wantsToOpen = false  // 是否提议开牌
  }

  resetRound() {
    this.hand = null
    this.hasFolded = false
    this.currentBet = 0
    this.totalBet = 0
    this.isActive = true
    this.wantsToOpen = false
  }

  send(msg) {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  /** 公开视图：其他玩家看到的信息（手牌隐藏） */
  toPublicView() {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      chips: this.chips,
      hasFolded: this.hasFolded,
      currentBet: this.currentBet,
      isActive: this.isActive,
      wantsToOpen: this.wantsToOpen,
      seatIndex: this.seatIndex,
      hand: null,
      isConnected: this.isConnected,
    }
  }

  /** 私有视图：自己看到的信息（包含手牌） */
  toPrivateView() {
    return {
      ...this.toPublicView(),
      hand: this.hand,
    }
  }
}
