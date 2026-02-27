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
    })

    this.pot = this.config.baseBlind * this.players.length
    this.phase = PHASE.BETTING
    this.bettingRound = 1
    this.currentPlayerIndex = startPlayerIndex
    this.dealingState = null

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

  /** 处理玩家操作 */
  processAction(playerId, actionType, payload) {
    const playerIndex = this.players.findIndex(p => p.id === playerId)
    if (playerIndex === -1 || playerIndex !== this.currentPlayerIndex) return false
    if (this.phase !== PHASE.BETTING) return false

    const player = this.players[playerIndex]
    let { pot, currentBet, bettingRound } = this

    switch (actionType) {
      case 'c2s:look': {
        player.hasLooked = true
        this.addLog(`${player.name} 看牌了`)
        break
      }

      case 'c2s:bet': {
        const betAmount = player.hasLooked ? currentBet * 2 : currentBet
        if (player.chips < betAmount) {
          pot += player.chips
          player.currentBet += player.chips
          player.chips = 0
          this.addLog(`${player.name} 全押 (筹码不足)`)
        } else {
          player.chips -= betAmount
          player.currentBet += betAmount
          pot += betAmount
          this.addLog(`${player.name} 跟注 ${betAmount}`)
        }
        break
      }

      case 'c2s:raise': {
        const raiseAmount = payload.amount || currentBet * 2
        const actualAmount = player.hasLooked ? raiseAmount * 2 : raiseAmount
        if (player.chips < actualAmount) {
          pot += player.chips
          player.currentBet += player.chips
          player.chips = 0
          this.addLog(`${player.name} 全押加注`)
        } else {
          player.chips -= actualAmount
          player.currentBet += actualAmount
          pot += actualAmount
          currentBet = raiseAmount
          this.addLog(`${player.name} 加注到 ${raiseAmount}`)
        }
        break
      }

      case 'c2s:fold': {
        player.hasFolded = true
        player.isActive = false
        this.addLog(`${player.name} 弃牌`)
        break
      }

      case 'c2s:compare': {
        if (bettingRound < this.config.minRoundsToCompare) {
          this.addLog(`还未到可比牌轮数（需 ${this.config.minRoundsToCompare} 轮）`)
          this.pot = pot
          this.currentBet = currentBet
          return false
        }

        const target = this.players.find(p => p.id === payload.targetPlayerId)
        if (!target || target.hasFolded || !target.isActive) return false

        const compareCost = player.hasLooked ? currentBet * 2 : currentBet
        player.chips -= compareCost
        pot += compareCost
        this.addLog(`${player.name} 向 ${target.name} 发起比牌`)

        const result = compareHands(player.hand[0], player.hand[1], target.hand[0], target.hand[1])

        if (result > 0) {
          target.hasFolded = true
          target.isActive = false
          this.addLog(`比牌结果：${player.name} 赢！${target.name} 出局`)
        } else if (result < 0) {
          player.hasFolded = true
          player.isActive = false
          this.addLog(`比牌结果：${target.name} 赢！${player.name} 出局`)
        } else {
          player.hasFolded = true
          player.isActive = false
          this.addLog(`比牌结果：平局！发起者 ${player.name} 出局`)
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
        winner.chips += this.pot
        this.winnerId = winner.id
        this.addLog(`${winner.name} 赢得底池 ${this.pot}！`)
      }
      this.pot = 0
      this.phase = PHASE.SETTLEMENT
      return true
    }

    // 移到下一个玩家
    if (actionType !== 'c2s:look') {
      const nextIndex = this.getNextActiveIndex(playerIndex)
      if (nextIndex <= playerIndex) {
        this.bettingRound = bettingRound + 1
      }
      this.currentPlayerIndex = nextIndex
    }

    return true
  }

  /** 摊牌 */
  doShowdown() {
    const activePlayers = this.getActivePlayers()
    this.addLog('--- 摊牌 ---')

    activePlayers.forEach(p => {
      const rank = getHandRank(p.hand[0], p.hand[1])
      this.addLog(`${p.name}: ${p.hand[0].name} + ${p.hand[1].name} = ${rank.name}`)
    })

    let winnerIdx = 0
    for (let i = 1; i < activePlayers.length; i++) {
      const cmp = compareHands(
        activePlayers[i].hand[0], activePlayers[i].hand[1],
        activePlayers[winnerIdx].hand[0], activePlayers[winnerIdx].hand[1],
      )
      if (cmp > 0) winnerIdx = i
    }

    const winner = activePlayers[winnerIdx]
    winner.chips += this.pot
    this.winnerId = winner.id
    this.addLog(`${winner.name} 赢得底池 ${this.pot}！`)
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
      config: this.config,
      winnerId: this.winnerId,
      logs: this.logs,
    }
  }
}
