/**
 * 抚州32张牌库定义
 *
 * 32张牌 = 大王 + 小王 + 15对(30张)
 *
 * 对子排名（从大到小）:
 *   Q(天) > 2(地) > 8红(人) > 4红(和红) > 10黑(梅黑) > 6黑(长二) > 4黑(和黑) > J(幺)
 *   其余对子无排名（并列最低，同牌先叫者大）
 *
 * pairGroup: 同 pairGroup 的两张牌才能组成对子
 */

// 牌的类型常量
export const CARD_TYPE = {
  JOKER_BIG: 'JOKER_BIG',
  JOKER_SMALL: 'JOKER_SMALL',
  NORMAL: 'NORMAL',
}

// 对子名称映射（按 pairGroup 查找）
export const PAIR_NAMES = {
  Q: '天',
  2: '地',
  '8R': '人',
  '4R': '和(红)',
  '10B': '梅(黑)',
  '6B': '长二',
  '4B': '和(黑)',
  J: '幺',
  '10R': '梅(红)',
  7: '短',
  5: '五',
  9: '九',
  A: '幺A',
  3: '三',
  K: 'K对',
}

/**
 * 完整的32张牌定义
 * id: 唯一标识
 * name: 显示名称
 * suit: 花色 (spade/heart/club/diamond/joker)
 * value: 牌面值
 * points: 用于计算点数
 * pairGroup: 配对组（同组两张牌才能组成对子）
 * pairRank: 对子排名（8最高，0为无排名）
 * type: 牌类型
 */
export const FULL_DECK = [
  // 至尊 - 大王小王
  { id: 'joker_big', name: '大王', suit: 'joker', value: 'BIG', points: 0, pairGroup: null, pairRank: -1, type: CARD_TYPE.JOKER_BIG, display: '🃏', color: 'red' },
  { id: 'joker_small', name: '小王', suit: 'joker', value: 'SMALL', points: 0, pairGroup: null, pairRank: -1, type: CARD_TYPE.JOKER_SMALL, display: '🂿', color: 'black' },

  // === 有排名的对子（从高到低） ===

  // 天 - Q♠Q♥ (rank 8)
  { id: 'q_spade', name: 'Q♠', suit: 'spade', value: 'Q', points: 0, pairGroup: 'Q', pairRank: 8, type: CARD_TYPE.NORMAL, display: 'Q', color: 'black' },
  { id: 'q_heart', name: 'Q♥', suit: 'heart', value: 'Q', points: 0, pairGroup: 'Q', pairRank: 8, type: CARD_TYPE.NORMAL, display: 'Q', color: 'red' },

  // 地 - 2♠2♥ (rank 7)
  { id: '2_spade', name: '2♠', suit: 'spade', value: '2', points: 2, pairGroup: '2', pairRank: 7, type: CARD_TYPE.NORMAL, display: '2', color: 'black' },
  { id: '2_heart', name: '2♥', suit: 'heart', value: '2', points: 2, pairGroup: '2', pairRank: 7, type: CARD_TYPE.NORMAL, display: '2', color: 'red' },

  // 人 - 8♥8♦ 红色对 (rank 6)
  { id: '8_heart', name: '8♥', suit: 'heart', value: '8', points: 8, pairGroup: '8R', pairRank: 6, type: CARD_TYPE.NORMAL, display: '8', color: 'red' },
  { id: '8_diamond', name: '8♦', suit: 'diamond', value: '8', points: 8, pairGroup: '8R', pairRank: 6, type: CARD_TYPE.NORMAL, display: '8', color: 'red' },

  // 和(红) - 4♥4♦ 红色对 (rank 5)
  { id: '4_heart', name: '4♥', suit: 'heart', value: '4', points: 4, pairGroup: '4R', pairRank: 5, type: CARD_TYPE.NORMAL, display: '4', color: 'red' },
  { id: '4_diamond', name: '4♦', suit: 'diamond', value: '4', points: 4, pairGroup: '4R', pairRank: 5, type: CARD_TYPE.NORMAL, display: '4', color: 'red' },

  // 梅(黑) - 10♠10♣ 黑色对 (rank 4)
  { id: '10_spade', name: '10♠', suit: 'spade', value: '10', points: 0, pairGroup: '10B', pairRank: 4, type: CARD_TYPE.NORMAL, display: '10', color: 'black' },
  { id: '10_club', name: '10♣', suit: 'club', value: '10', points: 0, pairGroup: '10B', pairRank: 4, type: CARD_TYPE.NORMAL, display: '10', color: 'black' },

  // 长二 - 6♠6♣ 黑色对 (rank 3)
  { id: '6_spade', name: '6♠', suit: 'spade', value: '6', points: 6, pairGroup: '6B', pairRank: 3, type: CARD_TYPE.NORMAL, display: '6', color: 'black' },
  { id: '6_club', name: '6♣', suit: 'club', value: '6', points: 6, pairGroup: '6B', pairRank: 3, type: CARD_TYPE.NORMAL, display: '6', color: 'black' },

  // 和(黑) - 4♠4♣ 黑色对 (rank 2)
  { id: '4_spade', name: '4♠', suit: 'spade', value: '4', points: 4, pairGroup: '4B', pairRank: 2, type: CARD_TYPE.NORMAL, display: '4', color: 'black' },
  { id: '4_club', name: '4♣', suit: 'club', value: '4', points: 4, pairGroup: '4B', pairRank: 2, type: CARD_TYPE.NORMAL, display: '4', color: 'black' },

  // 幺 - J♠J♥ (rank 1)
  { id: 'j_spade', name: 'J♠', suit: 'spade', value: 'J', points: 1, pairGroup: 'J', pairRank: 1, type: CARD_TYPE.NORMAL, display: 'J', color: 'black' },
  { id: 'j_heart', name: 'J♥', suit: 'heart', value: 'J', points: 1, pairGroup: 'J', pairRank: 1, type: CARD_TYPE.NORMAL, display: 'J', color: 'red' },

  // === 无排名的对子（rank 0，同牌先叫者大） ===

  // 梅(红) - 10♥10♦
  { id: '10_heart', name: '10♥', suit: 'heart', value: '10', points: 0, pairGroup: '10R', pairRank: 0, type: CARD_TYPE.NORMAL, display: '10', color: 'red' },
  { id: '10_diamond', name: '10♦', suit: 'diamond', value: '10', points: 0, pairGroup: '10R', pairRank: 0, type: CARD_TYPE.NORMAL, display: '10', color: 'red' },

  // 短 - 7♠7♥
  { id: '7_spade', name: '7♠', suit: 'spade', value: '7', points: 7, pairGroup: '7', pairRank: 0, type: CARD_TYPE.NORMAL, display: '7', color: 'black' },
  { id: '7_heart', name: '7♥', suit: 'heart', value: '7', points: 7, pairGroup: '7', pairRank: 0, type: CARD_TYPE.NORMAL, display: '7', color: 'red' },

  // 五 - 5♠5♥
  { id: '5_spade', name: '5♠', suit: 'spade', value: '5', points: 5, pairGroup: '5', pairRank: 0, type: CARD_TYPE.NORMAL, display: '5', color: 'black' },
  { id: '5_heart', name: '5♥', suit: 'heart', value: '5', points: 5, pairGroup: '5', pairRank: 0, type: CARD_TYPE.NORMAL, display: '5', color: 'red' },

  // 九 - 9♠9♥
  { id: '9_spade', name: '9♠', suit: 'spade', value: '9', points: 9, pairGroup: '9', pairRank: 0, type: CARD_TYPE.NORMAL, display: '9', color: 'black' },
  { id: '9_heart', name: '9♥', suit: 'heart', value: '9', points: 9, pairGroup: '9', pairRank: 0, type: CARD_TYPE.NORMAL, display: '9', color: 'red' },

  // 幺A - A♠A♥
  { id: 'a_spade', name: 'A♠', suit: 'spade', value: 'A', points: 1, pairGroup: 'A', pairRank: 0, type: CARD_TYPE.NORMAL, display: 'A', color: 'black' },
  { id: 'a_heart', name: 'A♥', suit: 'heart', value: 'A', points: 1, pairGroup: 'A', pairRank: 0, type: CARD_TYPE.NORMAL, display: 'A', color: 'red' },

  // 三 - 3♠3♥
  { id: '3_spade', name: '3♠', suit: 'spade', value: '3', points: 3, pairGroup: '3', pairRank: 0, type: CARD_TYPE.NORMAL, display: '3', color: 'black' },
  { id: '3_heart', name: '3♥', suit: 'heart', value: '3', points: 3, pairGroup: '3', pairRank: 0, type: CARD_TYPE.NORMAL, display: '3', color: 'red' },

  // K对 - K♠K♥
  { id: 'k_spade', name: 'K♠', suit: 'spade', value: 'K', points: 0, pairGroup: 'K', pairRank: 0, type: CARD_TYPE.NORMAL, display: 'K', color: 'black' },
  { id: 'k_heart', name: 'K♥', suit: 'heart', value: 'K', points: 0, pairGroup: 'K', pairRank: 0, type: CARD_TYPE.NORMAL, display: 'K', color: 'red' },
]

/**
 * Fisher-Yates 洗牌算法
 */
export function shuffleDeck(deck = [...FULL_DECK]) {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * 发牌：每人两张
 * @param {number} playerCount - 玩家数量 (2-16)
 * @returns {{ hands: Array<[card, card]>, remaining: Array }}
 */
export function dealCards(playerCount) {
  if (playerCount < 2 || playerCount > 16) {
    throw new Error('玩家数量必须在 2-16 之间')
  }
  if (playerCount * 2 > FULL_DECK.length) {
    throw new Error('玩家过多，牌不够发')
  }

  const shuffled = shuffleDeck()
  const hands = []

  for (let i = 0; i < playerCount; i++) {
    hands.push([shuffled[i * 2], shuffled[i * 2 + 1]])
  }

  return {
    hands,
    remaining: shuffled.slice(playerCount * 2),
  }
}
