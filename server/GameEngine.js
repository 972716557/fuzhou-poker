/**
 * 服务端权威游戏引擎
 * 从 gameReducer.js 移植，改为 class 形式，直接变更状态
 */

import { dealCards, shuffleDeck } from '../shared/deck.js'
import { getHandRank, compareHands } from '../shared/handRank.js'
import { PHASE, DEFAULT_CONFIG } from '../shared/constants.js'

/** 切牌计数值 */
function getCutCardValue(card) {
  if (card.value === 'BIG') return 6
  if (card.value === 'SMALL') return 3
  const map = { A: 1, J: 11, Q: 12, K: 13 }
  if (map[card.value] !== undefined) return map[card.value]
  return parseInt(card.value, 10) || 0
}

export class GameEngine {
  constructor() {
    this.phase = PHASE.WAITING
    this.pot = 0
    this.currentBet = DEFAULT_CONFIG.baseBlind
    this.currentPlayerIndex = 0
    this.dealerIndex = -1
    this.roundNumber = 0
    this.bettingRound = 0
    this.logs = []
    this.config = { ...DEFAULT_CONFIG }
    this.winnerId = null
    this.dealingState = null
    this.startPlayerIndex = 0
    this.callBetCount = 0
    this.lastAction = null
    this.lastRaiserId = null  // 最后一个主动提高注额的玩家 id
    this.players = [] // 由 Room 设置
  }

  setPlayers(players) {
    this.players = players
  }

  isRoundActive() {
    return this.phase !== PHASE.WAITING && this.phase !== PHASE.SETTLEMENT
  }

  getCurrentPlayerId() {
    const p = this.players[this.currentPlayerIndex]
    return p ? p.id : null
  }

  addLog(message) {
    const timestamp = new Date().toLocaleTimeString('zh-CN')
    this.logs = [{ message, timestamp, id: Date.now() + Math.random() }, ...this.logs].slice(0, 50)
  }

  /** 开始新一局：洗牌、切牌、计算起始位 */
  startRound() {
    this.players.forEach(p => p.resetRound())

    const { hands } = dealCards(this.players.length)
    const shuffledForCut = shuffleDeck()
    const cutCard = shuffledForCut[0]
    const cutValue = getCutCardValue(cutCard)

    this.dealerIndex = (this.dealerIndex + 1) % this.players.length
    const startPlayerIndex = (this.dealerIndex + cutValue - 1) % this.players.length

    this.roundNumber++
    this.phase = PHASE.DEALING
    this.pot = 0
    this.winnerId = null
    this.bettingRound = 0
    this.currentBet = this.config.baseBlind
    this.currentPlayerIndex = startPlayerIndex
    this.callBetCount = 0
    this.lastAction = null

    this.startPlayerIndex = startPlayerIndex
    this.dealingState = { cutCard, cutValue, startPlayerIndex, hands }
    this.addLog(`第 ${this.roundNumber} 局开始！切牌：${cutCard.name}，点数 ${cutValue}`)

    return {
      cutCard,
      cutValue,
      startPlayerIndex,
      dealerIndex: this.dealerIndex,
      roundNumber: this.roundNumber,
    }
  }

  /** 发牌动画完成后：分配手牌、收底注 */
  completeDeal() {
    if (!this.dealingState) return
    const { hands, startPlayerIndex } = this.dealingState

    this.players.forEach((p, i) => {
      p.hand = hands[i]
      p.chips -= this.config.baseBlind
      p.currentBet = this.config.baseBlind
      p.totalBet = this.config.baseBlind
    })

    this.pot = this.config.baseBlind * this.players.length
    this.phase = PHASE.BETTING
    this.bettingRound = 1
    this.currentPlayerIndex = startPlayerIndex
    this.dealingState = null
    this.callBetCount = 0
    this.lastAction = null
    // 底注相当于起始玩家定注，他是第一个"叫"的人
    this.lastRaiserId = this.players[startPlayerIndex]?.id || null

    this.addLog(`发牌完毕！底注 ${this.config.baseBlind}`)
  }

  /** 获取下一个活跃玩家 */
  getNextActiveIndex(fromIndex) {
    let next = (fromIndex + 1) % this.players.length
    let attempts = 0
    while (attempts < this.players.length) {
      if (this.players[next].isActive && !this.players[next].hasFolded) return next
      next = (next + 1) % this.players.length
      attempts++
    }
    return -1
  }

  getActivePlayers() {
    return this.players.filter(p => p.isActive && !p.hasFolded)
  }

  /** 获取玩家在本轮中的位置优先级（越小越靠前，先叫者大） */
  getPositionPriority(playerIndex) {
    return (playerIndex - this.startPlayerIndex + this.players.length) % this.players.length
  }

  /** 处理玩家操作 */
  processAction(playerId, actionType, payload) {
    const playerIndex = this.players.findIndex(p => p.id === playerId)
    if (playerIndex === -1 || playerIndex !== this.currentPlayerIndex) return false
    if (this.phase !== PHASE.BETTING) return false

    const player = this.players[playerIndex]
    let { pot, currentBet, bettingRound } = this

    switch (actionType) {
      case 'c2s:bet': {
        // 跟注：不改变 lastRaiserId
        const betAmount = currentBet
        let betLabel = '跟注'
        if (player.chips < betAmount) {
          pot += player.chips
          player.currentBet += player.chips
          player.totalBet += player.chips
          player.chips = 0
          betLabel = 'All in'
          this.addLog(`${player.name} All in (筹码不足)`)
        } else {
          player.chips -= betAmount
          player.currentBet += betAmount
          player.totalBet += betAmount
          pot += betAmount
          this.addLog(`${player.name} 跟注 ${betAmount}`)
        }
        this.lastAction = { playerId, label: betLabel, ts: Date.now() }
        break
      }

      case 'c2s:raise': {
        // 加注：成为新的 lastRaiser
        const raiseAmount = payload.amount || currentBet * 2
        if (player.chips < raiseAmount) {
          pot += player.chips
          player.currentBet += player.chips
          player.totalBet += player.chips
          player.chips = 0
          this.addLog(`${player.name} 全押加注`)
        } else {
          player.chips -= raiseAmount
          player.currentBet += raiseAmount
          player.totalBet += raiseAmount
          pot += raiseAmount
          currentBet = raiseAmount
          this.addLog(`${player.name} 加注到 ${raiseAmount}`)
        }
        this.lastRaiserId = playerId
        this.lastAction = { playerId, label: '加注', ts: Date.now() }
        break
      }

      case 'c2s:call_bet': {
        // 叫牌（恰提/带上）：成为新的 lastRaiser
        const newBet = currentBet * 2
        const payAmount = newBet
        let callLabel
        if (player.chips < payAmount) {
          pot += player.chips
          player.currentBet += player.chips
          player.totalBet += player.chips
          player.chips = 0
          currentBet = newBet
          callLabel = 'All in'
          this.addLog(`${player.name} All in!`)
        } else {
          player.chips -= payAmount
          player.currentBet += payAmount
          player.totalBet += payAmount
          pot += payAmount
          currentBet = newBet
          callLabel = this.callBetCount === 0 ? '恰提' : '带上'
          this.addLog(`${player.name} ${callLabel}！下注 ${payAmount}`)
        }
        this.callBetCount++
        this.lastRaiserId = playerId
        this.lastAction = { playerId, label: callLabel, ts: Date.now() }
        break
      }

      case 'c2s:kick': {
        // 踢脚：一脚=1个底注；踢的总金额不能超过底池；成为新的 lastRaiser
        const kicks = Math.floor(payload.kicks || 1)
        if (kicks < 1) return false
        const baseBlind = this.config.baseBlind
        const kickAmount = kicks * baseBlind
        if (kickAmount > pot) {
          this.addLog(`踢的金额不能超过底池 (${pot})`)
          return false
        }
        const newBet = currentBet + kickAmount
        const payAmount = newBet
        let kickLabel = `踢${kicks}脚`
        if (player.chips < payAmount) {
          pot += player.chips
          player.currentBet += player.chips
          player.totalBet += player.chips
          player.chips = 0
          currentBet = newBet
          kickLabel = 'All in'
          this.addLog(`${player.name} All in (踢${kicks}脚，筹码不足)`)
        } else {
          player.chips -= payAmount
          player.currentBet += payAmount
          player.totalBet += payAmount
          pot += payAmount
          currentBet = newBet
          this.addLog(`${player.name} 踢${kicks}脚！下注 ${payAmount}，跟注额升至 ${newBet}`)
        }
        this.lastRaiserId = playerId
        this.lastAction = { playerId, label: kickLabel, ts: Date.now() }
        break
      }

      case 'c2s:fold': {
        player.hasFolded = true
        player.isActive = false
        this.addLog(`${player.name} 弃牌`)
        this.lastAction = { playerId, label: '弃牌', ts: Date.now() }
        // 如果弃牌的人恰好是 lastRaiser，把 lastRaiserId 转移给下一个活跃玩家
        if (this.lastRaiserId === playerId) {
          const nextActive = this.getNextActiveIndex(playerIndex)
          this.lastRaiserId = nextActive !== -1 ? this.players[nextActive]?.id : null
        }
        break
      }

      case 'c2s:showdown': {
        this.pot = pot
        this.currentBet = currentBet
        this.doShowdown()
        return true
      }

      default:
        return false
    }

    this.pot = pot
    this.currentBet = currentBet

    // 检查是否只剩一人
    const activePlayers = this.getActivePlayers()
    if (activePlayers.length <= 1) {
      const winner = activePlayers[0]
      if (winner) {
        const allPlayers = this.players.filter(p => p.totalBet > 0)
        const awarded = this.settleSidePot(winner, allPlayers)
        for (const p of allPlayers) {
          if (p.totalBet > 0) {
            p.chips += p.totalBet
            this.addLog(`${p.name} 退还 ${p.totalBet}（超出赢家上限）`)
            p.totalBet = 0
          }
        }
        this.winnerId = winner.id
        this.addLog(`${winner.name} 赢得 ${awarded}！`)
      }
      this.pot = 0
      this.phase = PHASE.SETTLEMENT
      return true
    }

    // 移到下一个活跃玩家
    const nextIndex = this.getNextActiveIndex(playerIndex)
    const nextPlayer = this.players[nextIndex]

    // 回合结束判断：下一个要行动的人就是 lastRaiser，说明其他人都已响应
    // lastRaiser 是"最后一个主动提高注额的人"，他不需要再行动
    if (nextPlayer && nextPlayer.id === this.lastRaiserId) {
      // 所有人都响应了，进入亮牌
      this.addLog('所有人已响应，自动亮牌')
      this.doShowdown()
      return true
    }

    // 更新圈数（仅用于显示）
    if (nextIndex <= playerIndex) {
      this.bettingRound = bettingRound + 1
    }
    this.currentPlayerIndex = nextIndex

    return true
  }

  /**
   * Side pot 结算：赢家只能从每位玩家处赢走不超过自己 totalBet 的部分，
   * 超出部分退还给对应玩家。
   *
   * 示例：A踢1脚共出了20，B带上出了40，A牌大。
   *   A 最多从每人处赢 20，从B处赢20，剩余20退还B。
   */
  settleSidePot(winner, allPlayers) {
    const cap = winner.totalBet  // 赢家本局累计出注上限
    let winnings = 0
    for (const p of allPlayers) {
      const take = Math.min(p.totalBet, cap)
      winnings += take
      p.totalBet -= take  // 已被赢走的部分扣除
    }
    winner.chips += winnings
    winner.totalBet = 0
    return winnings
  }

  /** 找出最强玩家（按 compareHands + 位置优先级） */
  findBestPlayer(players) {
    let best = players[0]
    for (let i = 1; i < players.length; i++) {
      const p = players[i]
      const cmp = compareHands(p.hand[0], p.hand[1], best.hand[0], best.hand[1])
      if (cmp > 0) {
        best = p
      } else if (cmp === 0) {
        const pIdx = this.players.findIndex(x => x.id === p.id)
        const bIdx = this.players.findIndex(x => x.id === best.id)
        if (this.getPositionPriority(pIdx) < this.getPositionPriority(bIdx)) {
          best = p
        }
      }
    }
    return best
  }

  /** 摊牌 */
  doShowdown() {
    const activePlayers = this.getActivePlayers()
    this.addLog('--- 摊牌 ---')
    activePlayers.forEach(p => {
      const rank = getHandRank(p.hand[0], p.hand[1])
      this.addLog(`${p.name}: ${p.hand[0].name} + ${p.hand[1].name} = ${rank.name}`)
    })

    // 所有参与结算的玩家（包括已弃牌的，他们的 totalBet 也要参与分配）
    const allPlayers = this.players.filter(p => p.totalBet > 0)

    // 按 totalBet 从小到大，依次让最强者赢走自己上限内的底池
    const remaining = [...activePlayers]
    let totalAwarded = 0

    while (remaining.length > 0) {
      const winner = this.findBestPlayer(remaining)
      const awarded = this.settleSidePot(winner, allPlayers)
      if (awarded > 0) {
        this.addLog(`${winner.name} 赢得 ${awarded}`)
        totalAwarded += awarded
      }
      remaining.splice(remaining.indexOf(winner), 1)

      // 如果所有底池都分完了，退出
      if (allPlayers.every(p => p.totalBet === 0)) break
    }

    // 理论上不应有剩余，保险起见退还
    for (const p of allPlayers) {
      if (p.totalBet > 0) {
        p.chips += p.totalBet
        this.addLog(`${p.name} 退还 ${p.totalBet}（超出赢家上限）`)
        p.totalBet = 0
      }
    }

    this.winnerId = this.findBestPlayer(activePlayers).id
    this.pot = 0
    this.phase = PHASE.SETTLEMENT
  }

  /** 获取当前游戏状态（不含手牌，手牌由 Room 按玩家定制） */
  getState() {
    return {
      phase: this.phase,
      roundNumber: this.roundNumber,
      pot: this.pot,
      currentBet: this.currentBet,
      bettingRound: this.bettingRound,
      currentPlayerId: this.getCurrentPlayerId(),
      dealerPlayerId: this.players[this.dealerIndex]?.id || null,
      lastRaiserId: this.lastRaiserId,
      config: this.config,
      winnerId: this.winnerId,
      lastAction: this.lastAction,
      logs: this.logs,
    }
  }
}
