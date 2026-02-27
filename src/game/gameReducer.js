/**
 * 游戏状态机 (FSM) - 使用 useReducer 管理
 *
 * 状态流转：
 * WAITING -> DEALING -> BETTING -> SHOWDOWN -> SETTLEMENT -> WAITING
 */

import { PHASE, ACTION, DEFAULT_CONFIG } from '../../shared/constants.js'
import { dealCards, shuffleDeck } from '../../shared/deck.js'
import { getHandRank, compareHands } from '../../shared/handRank.js'

// Action Types
export const GAME_ACTIONS = {
  SET_PLAYERS: 'SET_PLAYERS',
  START_GAME: 'START_GAME',
  DEAL_COMPLETE: 'DEAL_COMPLETE',
  PLAYER_ACTION: 'PLAYER_ACTION',
  TIMEOUT: 'TIMEOUT',
  SHOWDOWN: 'SHOWDOWN',
  SETTLE: 'SETTLE',
  RESET: 'RESET',
  ADD_LOG: 'ADD_LOG',
}

/**
 * 切牌点数映射：A=1, 2=2, ..., 10=10, J=11, Q=12, K=13, 大王=6, 小王=3
 */
function getCutCardValue(card) {
  if (card.value === 'BIG') return 6
  if (card.value === 'SMALL') return 3
  const map = { A: 1, J: 11, Q: 12, K: 13 }
  if (map[card.value] !== undefined) return map[card.value]
  return parseInt(card.value, 10) || 0
}

/**
 * 创建初始玩家数据
 */
function createPlayer(id, name, avatar, chips) {
  return {
    id,
    name,
    avatar,
    chips,
    hand: null,        // [card1, card2]
    hasLooked: false,  // 是否已看牌
    hasFolded: false,  // 是否已弃牌
    currentBet: 0,     // 本局总下注
    isActive: true,    // 是否在本局中
    seatIndex: id,     // 座位编号
  }
}

/**
 * 初始游戏状态
 */
export function createInitialState(playerCount = 6) {
  const savedChips = loadChipsFromStorage()
  return {
    phase: PHASE.WAITING,
    players: [],
    playerCount,
    currentPlayerIndex: 0,  // 当前操作玩家索引
    dealerIndex: 0,         // 庄家索引
    pot: 0,                 // 底池
    currentBet: DEFAULT_CONFIG.baseBlind, // 当前跟注额
    roundNumber: 0,         // 当前轮数
    bettingRound: 0,        // 下注轮数（用于判断是否可以比牌）
    logs: [],               // 游戏日志
    config: { ...DEFAULT_CONFIG },
    winner: null,           // 本局赢家
    savedChips,             // 从 localStorage 读取的筹码
    dealingState: null,     // 发牌动画状态
  }
}

/**
 * localStorage 持久化
 */
function saveChipsToStorage(players) {
  const chips = {}
  players.forEach(p => { chips[p.id] = p.chips })
  try {
    localStorage.setItem('fuzhou_poker_chips', JSON.stringify(chips))
  } catch (e) { /* ignore */ }
}

function loadChipsFromStorage() {
  try {
    const data = localStorage.getItem('fuzhou_poker_chips')
    return data ? JSON.parse(data) : null
  } catch (e) {
    return null
  }
}

/**
 * 获取下一个活跃玩家索引
 */
function getNextActivePlayer(players, currentIndex) {
  let next = (currentIndex + 1) % players.length
  let attempts = 0
  while (attempts < players.length) {
    if (players[next].isActive && !players[next].hasFolded) {
      return next
    }
    next = (next + 1) % players.length
    attempts++
  }
  return -1 // 没有活跃玩家
}

/**
 * 获取存活玩家数
 */
function getActivePlayers(players) {
  return players.filter(p => p.isActive && !p.hasFolded)
}

/**
 * 添加日志
 */
function addLog(logs, message) {
  const timestamp = new Date().toLocaleTimeString('zh-CN')
  return [{ message, timestamp, id: Date.now() + Math.random() }, ...logs].slice(0, 50)
}

/**
 * 核心 Reducer
 */
export function gameReducer(state, action) {
  switch (action.type) {
    case GAME_ACTIONS.SET_PLAYERS: {
      return {
        ...state,
        playerCount: action.payload,
      }
    }

    case GAME_ACTIONS.START_GAME: {
      const { playerCount, config, savedChips } = state
      const { names, avatars } = action.payload || {}

      // 创建玩家（先不发手牌，等发牌动画完成后再分配）
      const players = []
      for (let i = 0; i < playerCount; i++) {
        const initialChips = savedChips?.[i] ?? config.initialChips
        players.push(createPlayer(
          i,
          names?.[i] || `玩家${i + 1}`,
          avatars?.[i] || '🧑',
          initialChips,
        ))
      }

      // 预先洗牌和发牌（数据层），但手牌暂不赋给玩家
      const { hands } = dealCards(playerCount)

      // 从洗好的牌堆中随机抽一张作为"切牌"（不参与实际手牌）
      const shuffledForCut = shuffleDeck()
      const cutCard = shuffledForCut[0]
      const cutValue = getCutCardValue(cutCard)

      // 根据切牌点数从庄家位开始数，数到的人先拿牌
      const dealerIndex = (state.dealerIndex + 1) % playerCount
      const startPlayerIndex = (dealerIndex + cutValue - 1) % playerCount

      const logs = addLog([], `第 ${state.roundNumber + 1} 局开始！切牌：${cutCard.name}，点数 ${cutValue}`)

      return {
        ...state,
        phase: PHASE.DEALING,
        players,
        pot: 0,
        currentPlayerIndex: startPlayerIndex,
        dealerIndex,
        roundNumber: state.roundNumber + 1,
        bettingRound: 0,
        currentBet: config.baseBlind,
        logs,
        winner: null,
        // 发牌动画需要的数据
        dealingState: {
          cutCard,
          cutValue,
          startPlayerIndex,
          hands, // 预分配好的手牌，动画完成后赋给玩家
        },
      }
    }

    case GAME_ACTIONS.DEAL_COMPLETE: {
      // 发牌动画完成，把手牌分配给玩家，收取底注，进入下注阶段
      const { dealingState, config } = state
      const players = state.players.map((p, i) => ({
        ...p,
        hand: dealingState.hands[i],
      }))

      const ante = config.baseBlind
      players.forEach(p => {
        p.chips -= ante
        p.currentBet = ante
      })
      const pot = ante * players.length

      const logs = addLog(state.logs, `发牌完毕！从 ${players[dealingState.startPlayerIndex].name} 开始，底注 ${ante}`)

      return {
        ...state,
        phase: PHASE.BETTING,
        players,
        pot,
        currentPlayerIndex: dealingState.startPlayerIndex,
        bettingRound: 1,
        logs,
        dealingState: null,
      }
    }

    case GAME_ACTIONS.PLAYER_ACTION: {
      const { playerIndex, actionType, amount, targetIndex } = action.payload
      const players = state.players.map(p => ({ ...p }))
      const player = players[playerIndex]
      let { pot, currentBet, bettingRound, phase, logs } = state

      if (playerIndex !== state.currentPlayerIndex) return state
      if (phase !== PHASE.BETTING) return state

      switch (actionType) {
        case ACTION.LOOK: {
          player.hasLooked = true
          logs = addLog(logs, `${player.name} 看牌了`)
          break
        }

        case ACTION.BET: {
          // 跟注：看牌后翻倍
          const betAmount = player.hasLooked ? currentBet * 2 : currentBet
          if (player.chips < betAmount) {
            // 筹码不足，全押
            pot += player.chips
            player.currentBet += player.chips
            player.chips = 0
            logs = addLog(logs, `${player.name} 全押 (筹码不足)`)
          } else {
            player.chips -= betAmount
            player.currentBet += betAmount
            pot += betAmount
            logs = addLog(logs, `${player.name} 跟注 ${betAmount}`)
          }
          break
        }

        case ACTION.RAISE: {
          const raiseAmount = amount || currentBet * 2
          const actualAmount = player.hasLooked ? raiseAmount * 2 : raiseAmount
          if (player.chips < actualAmount) {
            pot += player.chips
            player.currentBet += player.chips
            player.chips = 0
            logs = addLog(logs, `${player.name} 全押加注`)
          } else {
            player.chips -= actualAmount
            player.currentBet += actualAmount
            pot += actualAmount
            currentBet = raiseAmount
            logs = addLog(logs, `${player.name} 加注到 ${raiseAmount}`)
          }
          break
        }

        case ACTION.FOLD: {
          player.hasFolded = true
          player.isActive = false
          logs = addLog(logs, `${player.name} 弃牌`)
          break
        }

        case ACTION.COMPARE: {
          if (bettingRound < state.config.minRoundsToCompare) {
            logs = addLog(logs, `还未到可比牌轮数（需 ${state.config.minRoundsToCompare} 轮）`)
            return { ...state, logs }
          }

          const target = players[targetIndex]
          if (!target || target.hasFolded || !target.isActive) return state

          // 比牌费用
          const compareCost = player.hasLooked ? currentBet * 2 : currentBet
          player.chips -= compareCost
          pot += compareCost
          logs = addLog(logs, `${player.name} 向 ${target.name} 发起比牌`)

          const result = compareHands(
            player.hand[0], player.hand[1],
            target.hand[0], target.hand[1],
          )

          if (result > 0) {
            target.hasFolded = true
            target.isActive = false
            logs = addLog(logs, `比牌结果：${player.name} 赢！${target.name} 出局`)
          } else if (result < 0) {
            player.hasFolded = true
            player.isActive = false
            logs = addLog(logs, `比牌结果：${target.name} 赢！${player.name} 出局`)
          } else {
            // 平局 - 发起者输
            player.hasFolded = true
            player.isActive = false
            logs = addLog(logs, `比牌结果：平局！发起者 ${player.name} 出局`)
          }
          break
        }

        default:
          return state
      }

      // 检查是否只剩一人
      const activePlayers = getActivePlayers(players)
      if (activePlayers.length <= 1) {
        const winner = activePlayers[0]
        if (winner) {
          winner.chips += pot
          logs = addLog(logs, `${winner.name} 赢得底池 ${pot}！`)
        }
        saveChipsToStorage(players)
        return {
          ...state,
          players,
          pot: 0,
          phase: PHASE.SETTLEMENT,
          logs,
          winner: winner ? winner.id : null,
        }
      }

      // 移到下一个玩家
      let nextPlayer = getNextActivePlayer(players, playerIndex)

      // 如果轮了一圈回来，增加下注轮次
      let newBettingRound = bettingRound
      if (nextPlayer <= playerIndex || actionType === ACTION.LOOK) {
        // 看牌不算轮次推进，只有下注/加注/弃牌才推进
        if (actionType !== ACTION.LOOK) {
          newBettingRound = bettingRound + 1
        }
      }

      return {
        ...state,
        players,
        pot,
        currentBet,
        currentPlayerIndex: nextPlayer,
        bettingRound: newBettingRound,
        phase: PHASE.BETTING,
        logs,
      }
    }

    case GAME_ACTIONS.SHOWDOWN: {
      const players = state.players.map(p => ({ ...p }))
      let { pot, logs } = state

      // 所有存活玩家摊牌
      const activePlayers = getActivePlayers(players)
      logs = addLog(logs, '--- 摊牌 ---')

      // 显示每人牌型
      activePlayers.forEach(p => {
        const rank = getHandRank(p.hand[0], p.hand[1])
        logs = addLog(logs, `${p.name}: ${p.hand[0].name} + ${p.hand[1].name} = ${rank.name}`)
      })

      // 找出最大的
      let winnerIdx = 0
      for (let i = 1; i < activePlayers.length; i++) {
        const cmp = compareHands(
          activePlayers[i].hand[0], activePlayers[i].hand[1],
          activePlayers[winnerIdx].hand[0], activePlayers[winnerIdx].hand[1],
        )
        if (cmp > 0) winnerIdx = i
      }

      const winner = activePlayers[winnerIdx]
      const winnerInPlayers = players.find(p => p.id === winner.id)
      winnerInPlayers.chips += pot
      logs = addLog(logs, `${winner.name} 赢得底池 ${pot}！`)

      saveChipsToStorage(players)

      return {
        ...state,
        players,
        pot: 0,
        phase: PHASE.SETTLEMENT,
        logs,
        winner: winner.id,
      }
    }

    case GAME_ACTIONS.SETTLE: {
      // 结算后回到等待
      return {
        ...state,
        phase: PHASE.WAITING,
        winner: null,
      }
    }

    case GAME_ACTIONS.RESET: {
      localStorage.removeItem('fuzhou_poker_chips')
      return createInitialState(state.playerCount)
    }

    case GAME_ACTIONS.ADD_LOG: {
      return {
        ...state,
        logs: addLog(state.logs, action.payload),
      }
    }

    default:
      return state
  }
}
