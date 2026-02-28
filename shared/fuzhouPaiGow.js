/**
 * 抚州牌九 - 比牌规则模块（32张严格配比）
 * 支持前端特效文字显示，逻辑严密。
 *
 * 牌组配置、牌型优先级、单牌权重、结算逻辑均按规范实现。
 */

// ---------------------------------------------------------------------------
// 1. 严格牌组配置（共 32 张）
// 每张牌: id, name, suit, points (计算点数), rank (顶级单牌权重，用于点数平局)
// ---------------------------------------------------------------------------

/** 顶级单牌权重顺序：红Q(8) > 红2(7) > 红8(6) > 红4(5) > 黑10(4) > 黑6(3) > 黑4(2) > 黑J(1)，其余为 0（普通权重） */
const TOP_RANK = {
  RED_Q: 8,
  RED_2: 7,
  RED_8: 6,
  RED_4: 5,
  BLACK_10: 4,
  BLACK_6: 3,
  BLACK_4: 2,
  BLACK_J: 1,
  NORMAL: 0,
}

export const FUZHOU_DECK = [
  // 王牌/鬼牌 (2张)
  { id: 'joker_big', name: '大鬼', suit: 'joker', value: 'BIG', points: 6, rank: TOP_RANK.NORMAL },
  { id: 'joker_small', name: '小鬼', suit: 'joker', value: 'SMALL', points: 3, rank: TOP_RANK.NORMAL },

  // 天牌 (2张) 红桃Q、方块Q
  { id: 'q_heart', name: '红桃Q', suit: 'heart', value: 'Q', points: 12, rank: TOP_RANK.RED_Q },
  { id: 'q_diamond', name: '方块Q', suit: 'diamond', value: 'Q', points: 12, rank: TOP_RANK.RED_Q },

  // 地牌 (2张) 红桃2、方块2
  { id: '2_heart', name: '红桃2', suit: 'heart', value: '2', points: 2, rank: TOP_RANK.RED_2 },
  { id: '2_diamond', name: '方块2', suit: 'diamond', value: '2', points: 2, rank: TOP_RANK.RED_2 },

  // 人牌/普通8 (4张)
  { id: '8_heart', name: '红桃8', suit: 'heart', value: '8', points: 8, rank: TOP_RANK.RED_8 },
  { id: '8_diamond', name: '方块8', suit: 'diamond', value: '8', points: 8, rank: TOP_RANK.RED_8 },
  { id: '8_spade', name: '黑桃8', suit: 'spade', value: '8', points: 8, rank: TOP_RANK.NORMAL },
  { id: '8_club', name: '梅花8', suit: 'club', value: '8', points: 8, rank: TOP_RANK.NORMAL },

  // 和牌/板凳 (4张)
  { id: '4_heart', name: '红桃4', suit: 'heart', value: '4', points: 4, rank: TOP_RANK.RED_4 },
  { id: '4_diamond', name: '方块4', suit: 'diamond', value: '4', points: 4, rank: TOP_RANK.RED_4 },
  { id: '4_spade', name: '黑桃4', suit: 'spade', value: '4', points: 4, rank: TOP_RANK.BLACK_4 },
  { id: '4_club', name: '梅花4', suit: 'club', value: '4', points: 4, rank: TOP_RANK.BLACK_4 },

  // 梅牌/普通10 (4张)
  { id: '10_spade', name: '黑桃10', suit: 'spade', value: '10', points: 10, rank: TOP_RANK.BLACK_10 },
  { id: '10_club', name: '梅花10', suit: 'club', value: '10', points: 10, rank: TOP_RANK.BLACK_10 },
  { id: '10_heart', name: '红桃10', suit: 'heart', value: '10', points: 10, rank: TOP_RANK.NORMAL },
  { id: '10_diamond', name: '方块10', suit: 'diamond', value: '10', points: 10, rank: TOP_RANK.NORMAL },

  // 长三/普通6 (4张)
  { id: '6_spade', name: '黑桃6', suit: 'spade', value: '6', points: 6, rank: TOP_RANK.BLACK_6 },
  { id: '6_club', name: '梅花6', suit: 'club', value: '6', points: 6, rank: TOP_RANK.BLACK_6 },
  { id: '6_heart', name: '红桃6', suit: 'heart', value: '6', points: 6, rank: TOP_RANK.NORMAL },
  { id: '6_diamond', name: '方块6', suit: 'diamond', value: '6', points: 6, rank: TOP_RANK.NORMAL },

  // 斧头 (2张) 黑桃J、梅花J
  { id: 'j_spade', name: '黑桃J', suit: 'spade', value: 'J', points: 11, rank: TOP_RANK.BLACK_J },
  { id: 'j_club', name: '梅花J', suit: 'club', value: 'J', points: 11, rank: TOP_RANK.BLACK_J },

  // 翻王牌 (2张) 黑桃9、梅花9
  { id: '9_spade', name: '黑桃9', suit: 'spade', value: '9', points: 9, rank: TOP_RANK.NORMAL },
  { id: '9_club', name: '梅花9', suit: 'club', value: '9', points: 9, rank: TOP_RANK.NORMAL },

  // 7点 (4张)
  { id: '7_spade', name: '黑桃7', suit: 'spade', value: '7', points: 7, rank: TOP_RANK.NORMAL },
  { id: '7_club', name: '梅花7', suit: 'club', value: '7', points: 7, rank: TOP_RANK.NORMAL },
  { id: '7_heart', name: '红桃7', suit: 'heart', value: '7', points: 7, rank: TOP_RANK.NORMAL },
  { id: '7_diamond', name: '方块7', suit: 'diamond', value: '7', points: 7, rank: TOP_RANK.NORMAL },

  // 5点 (2张) 黑桃5、梅花5
  { id: '5_spade', name: '黑桃5', suit: 'spade', value: '5', points: 5, rank: TOP_RANK.NORMAL },
  { id: '5_club', name: '梅花5', suit: 'club', value: '5', points: 5, rank: TOP_RANK.NORMAL },
]

const CARD_BY_ID = new Map(FUZHOU_DECK.map(c => [c.id, c]))

/** 将现有牌对象规范为带 points/rank 的牌（兼容 shared/deck.js 的 id） */
function normalizeCard(card) {
  if (!card) return null
  const canonical = CARD_BY_ID.get(card.id)
  if (canonical) return canonical
  return {
    id: card.id,
    name: card.name || card.id,
    suit: card.suit,
    value: card.value,
    points: card.points ?? 0,
    rank: card.rank ?? TOP_RANK.NORMAL,
  }
}

// ---------------------------------------------------------------------------
// 2. 牌型优先级与炸裂名称（从高到低）
// ---------------------------------------------------------------------------

const LEVEL = {
  ZHI_ZUN: 10,
  TOP_PAIRS: 9,
  NORMAL_PAIRS: 8,
  TIAN_JIU_FAN_WANG: 7,
  SPECIAL_GANG: 6,
  POINTS: 1,
}

/** 顶级对子名称（严格花色） */
const TOP_PAIR_NAMES = {
  RED_Q: '天对',
  RED_2: '地对',
  RED_8: '人对',
  RED_4: '和对',
  BLACK_10: '梅对',
  BLACK_6: '长对',
  BLACK_4: '板对',
  BLACK_J: '斧对',
}

function isJokerBig(c) {
  return c.value === 'BIG' || c.id === 'joker_big'
}
function isJokerSmall(c) {
  return c.value === 'SMALL' || c.id === 'joker_small'
}
function isRedQ(c) {
  return (c.value === 'Q' && (c.suit === 'heart' || c.suit === 'diamond'))
}
function isRed2(c) {
  return (c.value === '2' && (c.suit === 'heart' || c.suit === 'diamond'))
}
function isRed8(c) {
  return (c.value === '8' && (c.suit === 'heart' || c.suit === 'diamond'))
}
function isRed4(c) {
  return (c.value === '4' && (c.suit === 'heart' || c.suit === 'diamond'))
}
function isBlack10(c) {
  return (c.value === '10' && (c.suit === 'spade' || c.suit === 'club'))
}
function isBlack6(c) {
  return (c.value === '6' && (c.suit === 'spade' || c.suit === 'club'))
}
function isBlack4(c) {
  return (c.value === '4' && (c.suit === 'spade' || c.suit === 'club'))
}
function isBlackJ(c) {
  return (c.value === 'J' && (c.suit === 'spade' || c.suit === 'club'))
}
function isBlack9(c) {
  return (c.value === '9' && (c.suit === 'spade' || c.suit === 'club'))
}
function isAny8(c) {
  return c.value === '8'
}

/**
 * 获取顶级对子类型（严格花色）
 */
function getTopPairType(a, b) {
  if (isRedQ(a) && isRedQ(b)) return { key: 'RED_Q', name: TOP_PAIR_NAMES.RED_Q }
  if (isRed2(a) && isRed2(b)) return { key: 'RED_2', name: TOP_PAIR_NAMES.RED_2 }
  if (isRed8(a) && isRed8(b)) return { key: 'RED_8', name: TOP_PAIR_NAMES.RED_8 }
  if (isRed4(a) && isRed4(b)) return { key: 'RED_4', name: TOP_PAIR_NAMES.RED_4 }
  if (isBlack10(a) && isBlack10(b)) return { key: 'BLACK_10', name: TOP_PAIR_NAMES.BLACK_10 }
  if (isBlack6(a) && isBlack6(b)) return { key: 'BLACK_6', name: TOP_PAIR_NAMES.BLACK_6 }
  if (isBlack4(a) && isBlack4(b)) return { key: 'BLACK_4', name: TOP_PAIR_NAMES.BLACK_4 }
  if (isBlackJ(a) && isBlackJ(b)) return { key: 'BLACK_J', name: TOP_PAIR_NAMES.BLACK_J }
  return null
}

/**
 * 是否为同点数的普通对子（两张牌点数相同或 value 相同，且不是顶级对子）
 */
function isNormalPair(a, b) {
  if (isJokerBig(a) || isJokerSmall(a) || isJokerBig(b) || isJokerSmall(b)) return false
  const top = getTopPairType(a, b)
  if (top) return false
  return a.value === b.value || (a.points === b.points && a.points !== undefined)
}

/**
 * 常规点数：(CardA.points + CardB.points) % 10，0 为毙十
 */
function calcPointValue(a, b) {
  const sum = (a.points + b.points) % 10
  return sum
}

/**
 * 牌型判定与等级
 * @param {Array<Object>} cards - 两张牌（可为 shared/deck 格式，按 id 规范）
 * @returns {{ name: string, level: number, points?: number, displayText?: string, subRank?: number }}
 */
export function getHandResult(cards) {
  if (!Array.isArray(cards) || cards.length !== 2) {
    return { name: '无效', level: 0, displayText: '无效' }
  }
  const [a, b] = cards.map(normalizeCard)
  if (!a || !b) return { name: '无效', level: 0, displayText: '无效' }

  // Level 10: 至尊对王
  if ((isJokerBig(a) && isJokerSmall(b)) || (isJokerSmall(a) && isJokerBig(b))) {
    return {
      name: '至尊对王',
      level: LEVEL.ZHI_ZUN,
      displayText: '至尊对王',
    }
  }

  // Level 9: 顶级对子（严格花色）
  const topPair = getTopPairType(a, b)
  if (topPair) {
    return {
      name: topPair.name,
      level: LEVEL.TOP_PAIRS,
      displayText: topPair.name,
      subRank: Object.keys(TOP_PAIR_NAMES).indexOf(topPair.key),
    }
  }

  // Level 8: 普通对子
  if (isNormalPair(a, b)) {
    return {
      name: '普通对子',
      level: LEVEL.NORMAL_PAIRS,
      displayText: `对子·${a.value || a.name}`,
    }
  }

  // Level 7: 天九翻王（任一红Q + 任一黑9），视为 11 点
  if ((isRedQ(a) && isBlack9(b)) || (isRedQ(b) && isBlack9(a))) {
    return {
      name: '天九翻王',
      level: LEVEL.TIAN_JIU_FAN_WANG,
      points: 11,
      displayText: '天九翻王（11点）',
    }
  }

  // Level 6: 天杠（红Q+任意8）、地杠（红2+任意8），视为 10 点
  if ((isRedQ(a) && isAny8(b)) || (isRedQ(b) && isAny8(a))) {
    return {
      name: '天杠',
      level: LEVEL.SPECIAL_GANG,
      points: 10,
      displayText: '天杠（10点）',
    }
  }
  if ((isRed2(a) && isAny8(b)) || (isRed2(b) && isAny8(a))) {
    return {
      name: '地杠',
      level: LEVEL.SPECIAL_GANG,
      points: 10,
      displayText: '地杠（10点）',
    }
  }

  // Level 1-5: 常规点数
  const pointVal = calcPointValue(a, b)
  const pointName = pointVal === 0 ? '毙十' : `${pointVal}点`
  return {
    name: pointName,
    level: LEVEL.POINTS,
    points: pointVal,
    displayText: pointName,
    cardA: a,
    cardB: b,
  }
}

// ---------------------------------------------------------------------------
// 3. 单牌权重判定（用于点数平局）
// ---------------------------------------------------------------------------

/**
 * 获取单牌在“顶级有序权重”中的权重；其余为普通权重 0
 */
export function getSingleCardRank(card) {
  const c = normalizeCard(card)
  if (!c) return 0
  return c.rank ?? TOP_RANK.NORMAL
}

/**
 * 比较两手牌中“最大单牌”的权重（用于点数相同时）
 * 返回正数表示 hand1 大，负数 hand2 大，0 表示需按先叫牌者胜
 */
function compareSingleCardRank(hand1Cards, hand2Cards) {
  const [a1, b1] = hand1Cards.map(normalizeCard)
  const [a2, b2] = hand2Cards.map(normalizeCard)
  const max1 = Math.max(getSingleCardRank(a1), getSingleCardRank(b1))
  const max2 = Math.max(getSingleCardRank(a2), getSingleCardRank(b2))
  if (max1 !== max2) return max1 - max2
  if (max1 === 0 && max2 === 0) return 0
  const min1 = Math.min(getSingleCardRank(a1), getSingleCardRank(b1))
  const min2 = Math.min(getSingleCardRank(a2), getSingleCardRank(b2))
  return min1 - min2
}

// ---------------------------------------------------------------------------
// 4. 结算逻辑 compareHands(p1, p2)
// ---------------------------------------------------------------------------

/**
 * 比较两个玩家的手牌
 * @param {Object} p1 - 玩家1 { cards: [card, card], isInitiator: boolean, name?: string }
 * @param {Object} p2 - 玩家2 同上
 * @returns {{ winner: 1|2|null, winnerName?: string, reason?: string, log?: string }}
 *   winner: 1 表示 p1 胜，2 表示 p2 胜，null 表示绝对平局（按规则不应出现）
 *   reason: 用于前端展示的简短原因
 *   log: 日志文案，绝对平局时打印“触发叫牌顺序获胜规则：[玩家名] 胜”
 */
export function compareHands(p1, p2) {
  const cards1 = Array.isArray(p1.cards) ? p1.cards : []
  const cards2 = Array.isArray(p2.cards) ? p2.cards : []
  const name1 = p1.name || '玩家1'
  const name2 = p2.name || '玩家2'
  const init1 = !!p1.isInitiator
  const init2 = !!p2.isInitiator

  const r1 = getHandResult(cards1)
  const r2 = getHandResult(cards2)

  if (r1.level !== r2.level) {
    const winner = r1.level > r2.level ? 1 : 2
    const winnerName = winner === 1 ? name1 : name2
    return {
      winner,
      winnerName,
      reason: winner === 1 ? r1.displayText : r2.displayText,
      hand1: r1,
      hand2: r2,
    }
  }

  // 同等级
  if (r1.level === LEVEL.NORMAL_PAIRS) {
    const winner = init1 ? 1 : (init2 ? 2 : null)
    const log = winner != null
      ? `触发叫牌顺序获胜规则：${winner === 1 ? name1 : name2} 胜`
      : undefined
    if (winner != null && log) console.log(log)
    return {
      winner: winner ?? 1,
      winnerName: winner === 1 ? name1 : name2,
      reason: '普通对子·先叫牌者胜',
      hand1: r1,
      hand2: r2,
      log: log,
    }
  }

  if (r1.level === LEVEL.TOP_PAIRS) {
    const sub1 = r1.subRank ?? 0
    const sub2 = r2.subRank ?? 0
    if (sub1 !== sub2) {
      const winner = sub1 < sub2 ? 1 : 2
      return {
        winner,
        winnerName: winner === 1 ? name1 : name2,
        reason: winner === 1 ? r1.displayText : r2.displayText,
        hand1: r1,
        hand2: r2,
      }
    }
    const winner = init1 ? 1 : (init2 ? 2 : 1)
    const log = `触发叫牌顺序获胜规则：${winner === 1 ? name1 : name2} 胜`
    console.log(log)
    return { winner, winnerName: winner === 1 ? name1 : name2, reason: '先叫牌者胜', hand1: r1, hand2: r2, log }
  }

  if (r1.level === LEVEL.POINTS || r1.level === LEVEL.SPECIAL_GANG || r1.level === LEVEL.TIAN_JIU_FAN_WANG) {
    const pts1 = r1.points ?? calcPointValue(normalizeCard(cards1[0]), normalizeCard(cards1[1]))
    const pts2 = r2.points ?? calcPointValue(normalizeCard(cards2[0]), normalizeCard(cards2[1]))
    if (pts1 !== pts2) {
      const winner = pts1 > pts2 ? 1 : 2
      return {
        winner,
        winnerName: winner === 1 ? name1 : name2,
        reason: winner === 1 ? r1.displayText : r2.displayText,
        hand1: r1,
        hand2: r2,
      }
    }
    const cmp = compareSingleCardRank(cards1, cards2)
    if (cmp !== 0) {
      const winner = cmp > 0 ? 1 : 2
      return {
        winner,
        winnerName: winner === 1 ? name1 : name2,
        reason: '单牌权重大',
        hand1: r1,
        hand2: r2,
      }
    }
    const winner = init1 ? 1 : (init2 ? 2 : 1)
    const log = `触发叫牌顺序获胜规则：${winner === 1 ? name1 : name2} 胜`
    console.log(log)
    return { winner, winnerName: winner === 1 ? name1 : name2, reason: '先叫牌者胜', hand1: r1, hand2: r2, log }
  }

  if (r1.level === LEVEL.ZHI_ZUN) {
    return { winner: 1, winnerName: name1, reason: '至尊对王', hand1: r1, hand2: r2 }
  }

  const winner = init1 ? 1 : (init2 ? 2 : 1)
  const log = `触发叫牌顺序获胜规则：${winner === 1 ? name1 : name2} 胜`
  console.log(log)
  return { winner, winnerName: winner === 1 ? name1 : name2, reason: '先叫牌者胜', hand1: r1, hand2: r2, log }
}

/**
 * 获取牌型展示用颜色（前端特效）
 */
export function getHandResultColor(result) {
  if (!result || result.level === undefined) return '#888'
  switch (result.level) {
    case LEVEL.ZHI_ZUN: return '#ff4444'
    case LEVEL.TOP_PAIRS: return '#ffaa00'
    case LEVEL.NORMAL_PAIRS: return '#ffcc00'
    case LEVEL.TIAN_JIU_FAN_WANG: return '#44aaff'
    case LEVEL.SPECIAL_GANG: return '#aa44ff'
    default:
      if (result.points >= 8) return '#44ff44'
      if (result.points >= 5) return '#ffffff'
      return '#888888'
  }
}

export { LEVEL, TOP_RANK, TOP_PAIR_NAMES }
