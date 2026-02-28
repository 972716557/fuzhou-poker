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
    // 底池结转：不清零，保留上一轮剩余
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

  /** 发牌动画完成后：分配手牌、强制补仓（底池不足时收底注） */
  completeDeal() {
    if (!this.dealingState) return
    const { hands, startPlayerIndex } = this.dealingState

    this.players.forEach((p, i) => {
      p.hand = hands[i]
    })

    // 强制补仓：底池低于"初始基础底池"（玩家数 × 底注）时，全员追加底注
    const basePot = this.config.baseBlind * this.players.length
    if (this.pot < basePot) {
      const ante = this.config.baseBlind
      this.players.forEach(p => {
        const pay = Math.min(ante, p.chips)
        p.chips -= pay
        p.currentBet = pay
        p.totalBet = pay
        this.pot += pay
      })
      this.addLog(`发牌完毕！补仓底注 ${this.config.baseBlind}，底池 ${this.pot}`)
    } else {
      // 底池充足，不收底注
      this.players.forEach(p => {
        p.currentBet = 0
        p.totalBet = 0
      })
      this.addLog(`发牌完毕！底池结转 ${this.pot}，无需补仓`)
    }

    this.phase = PHASE.BETTING
    this.bettingRound = 1
    this.currentPlayerIndex = startPlayerIndex
    this.dealingState = null
    this.callBetCount = 0
    this.lastAction = null
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
        // 跟注：重置自己的 wantsToOpen；下注上限 = 底池
        const betAmount = Math.min(currentBet, pot)
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
        player.wantsToOpen = false
        this.lastAction = { playerId, label: betLabel, ts: Date.now() }
        break
      }

      case 'c2s:call_bet': {
        // 叫牌（恰提/带上）：翻倍 currentBet，下注上限 = 底池
        const newBet = Math.min(currentBet * 2, pot)
        if (newBet <= currentBet) return false // 底池不够，无法加注
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
        // 加注行为：重置所有其他活跃玩家的 wantsToOpen
        this.getActivePlayers().forEach(p => {
          if (p.id !== playerId) p.wantsToOpen = false
        })
        this.callBetCount++
        this.lastAction = { playerId, label: callLabel, ts: Date.now() }
        break
      }

      case 'c2s:kick': {
        // 踢一脚：下注上限 = 底池
        const kicks = Math.floor(payload.kicks || 1)
        if (kicks < 1) return false
        const baseBlind = this.config.baseBlind
        const kickAmount = kicks * baseBlind
        const newBet = Math.min(currentBet + kickAmount, pot)
        if (newBet <= currentBet) {
          this.addLog(`底池不足，无法踢 (${pot})`)
          return false
        }
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
        // 加注行为：重置所有其他活跃玩家的 wantsToOpen
        this.getActivePlayers().forEach(p => {
          if (p.id !== playerId) p.wantsToOpen = false
        })
        this.lastAction = { playerId, label: kickLabel, ts: Date.now() }
        break
      }

      case 'c2s:fold': {
        player.hasFolded = true
        player.isActive = false
        this.addLog(`${player.name} 弃牌`)
        this.lastAction = { playerId, label: '弃牌', ts: Date.now() }
        break
      }

      case 'c2s:showdown': {
        // 提议开牌：免费，设置 wantsToOpen = true，传给下一家
        player.wantsToOpen = true
        this.addLog(`${player.name} 提议开牌`)
        this.lastAction = { playerId, label: '开牌', ts: Date.now() }
        break
      }

      default:
        return false
    }

    this.pot = pot
    this.currentBet = currentBet

    // 条件1：检查是否只剩一人（剩者为王）
    const activePlayers = this.getActivePlayers()
    if (activePlayers.length <= 1) {
      const winner = activePlayers[0]
      if (winner) {
        this.settleWinner(winner)
      }
      this.players.forEach(p => p.totalBet = 0)
      this.phase = PHASE.SETTLEMENT
      return true
    }

    // 条件2：全员共识开牌 — 所有活跃玩家都提议了开牌
    if (activePlayers.every(p => p.wantsToOpen)) {
      this.addLog('全员同意开牌！')
      this.doShowdown()
      return true
    }

    // 移到下一个活跃玩家
    const nextIndex = this.getNextActiveIndex(playerIndex)

    // 更新圈数（仅用于显示）
    if (nextIndex <= playerIndex) {
      this.bettingRound = bettingRound + 1
    }
    this.currentPlayerIndex = nextIndex

    return true
  }

  /** 找出最强玩家（按 fuzhouPaiGow 规则 + 先叫牌者胜；位置优者视为先叫） */
  findBestPlayer(players) {
    let best = players[0]
    for (let i = 1; i < players.length; i++) {
      const p = players[i]
      const pIdx = this.players.findIndex(x => x.id === p.id)
      const bIdx = this.players.findIndex(x => x.id === best.id)
      const pFirst = this.getPositionPriority(pIdx) < this.getPositionPriority(bIdx)
      const cmp = compareHands(p.hand[0], p.hand[1], best.hand[0], best.hand[1], pFirst)
      if (cmp > 0) best = p
    }
    return best
  }

  /**
   * 结算赢家：收益上限为自身本轮下注额，剩余底池结转至下一轮。
   * winnerPayout = min(pot, 2 × winner.totalBet)
   *   = 本金退还 + 盈利（盈利上限 = totalBet）
   */
  settleWinner(winner) {
    const ownBet = winner.totalBet
    const payout = Math.min(this.pot, 2 * ownBet)
    const profit = payout - ownBet
    winner.chips += payout
    this.pot -= payout
    this.winnerId = winner.id
    this.addLog(`${winner.name} 赢得 ${profit}（本金 ${ownBet} + 盈利 ${profit}）`)
    if (this.pot > 0) {
      this.addLog(`底池结转 ${this.pot} 至下一轮`)
    }
  }

  /** 摊牌 */
  doShowdown() {
    const activePlayers = this.getActivePlayers()
    this.addLog('--- 摊牌 ---')
    activePlayers.forEach(p => {
      const rank = getHandRank(p.hand[0], p.hand[1])
      this.addLog(`${p.name}: ${p.hand[0].name} + ${p.hand[1].name} = ${rank.name}`)
    })

    const winner = this.findBestPlayer(activePlayers)
    this.settleWinner(winner)
    this.players.forEach(p => p.totalBet = 0)
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
      config: this.config,
      winnerId: this.winnerId,
      lastAction: this.lastAction,
      logs: this.logs,
    }
  }
}
