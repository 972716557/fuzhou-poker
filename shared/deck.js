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
  '7R': '红七',
  '6R': '红六',
  5: '五',
  9: '九',
  '8B': '黑八',
  4: '和',
}

/**
 * 完整的32张牌定义（抚州32张标准牌组）
 * 红=♥♦，黑=♠♣。无 A、3、K。
 */
export const FULL_DECK = [
  // 至尊（鬼牌）
  { id: 'joker_big', name: '大鬼', suit: 'joker', value: 'BIG', points: 0, pairGroup: null, pairRank: -1, type: CARD_TYPE.JOKER_BIG, display: '大鬼', color: 'red' },
  { id: 'joker_small', name: '小鬼', suit: 'joker', value: 'SMALL', points: 0, pairGroup: null, pairRank: -1, type: CARD_TYPE.JOKER_SMALL, display: '小鬼', color: 'black' },

  // 天 - 红Q (♥♦)
  { id: 'q_heart', name: 'Q♥', suit: 'heart', value: 'Q', points: 0, pairGroup: 'Q', pairRank: 8, type: CARD_TYPE.NORMAL, display: 'Q', color: 'red' },
  { id: 'q_diamond', name: 'Q♦', suit: 'diamond', value: 'Q', points: 0, pairGroup: 'Q', pairRank: 8, type: CARD_TYPE.NORMAL, display: 'Q', color: 'red' },

  // 地 - 红2 (♥♦)
  { id: '2_heart', name: '2♥', suit: 'heart', value: '2', points: 2, pairGroup: '2', pairRank: 7, type: CARD_TYPE.NORMAL, display: '2', color: 'red' },
  { id: '2_diamond', name: '2♦', suit: 'diamond', value: '2', points: 2, pairGroup: '2', pairRank: 7, type: CARD_TYPE.NORMAL, display: '2', color: 'red' },

  // 人 - 红8 (♥♦)
  { id: '8_heart', name: '8♥', suit: 'heart', value: '8', points: 8, pairGroup: '8R', pairRank: 6, type: CARD_TYPE.NORMAL, display: '8', color: 'red' },
  { id: '8_diamond', name: '8♦', suit: 'diamond', value: '8', points: 8, pairGroup: '8R', pairRank: 6, type: CARD_TYPE.NORMAL, display: '8', color: 'red' },

  // 和(红) - 红4 (♥♦)
  { id: '4_heart', name: '4♥', suit: 'heart', value: '4', points: 4, pairGroup: '4R', pairRank: 5, type: CARD_TYPE.NORMAL, display: '4', color: 'red' },
  { id: '4_diamond', name: '4♦', suit: 'diamond', value: '4', points: 4, pairGroup: '4R', pairRank: 5, type: CARD_TYPE.NORMAL, display: '4', color: 'red' },

  // 梅(黑) - 黑10 (♠♣)
  { id: '10_spade', name: '10♠', suit: 'spade', value: '10', points: 0, pairGroup: '10B', pairRank: 4, type: CARD_TYPE.NORMAL, display: '10', color: 'black' },
  { id: '10_club', name: '10♣', suit: 'club', value: '10', points: 0, pairGroup: '10B', pairRank: 4, type: CARD_TYPE.NORMAL, display: '10', color: 'black' },

  // 长二 - 黑6 (♠♣)
  { id: '6_spade', name: '6♠', suit: 'spade', value: '6', points: 6, pairGroup: '6B', pairRank: 3, type: CARD_TYPE.NORMAL, display: '6', color: 'black' },
  { id: '6_club', name: '6♣', suit: 'club', value: '6', points: 6, pairGroup: '6B', pairRank: 3, type: CARD_TYPE.NORMAL, display: '6', color: 'black' },

  // 和(黑) - 黑4 (♠♣)
  { id: '4_spade', name: '4♠', suit: 'spade', value: '4', points: 4, pairGroup: '4B', pairRank: 2, type: CARD_TYPE.NORMAL, display: '4', color: 'black' },
  { id: '4_club', name: '4♣', suit: 'club', value: '4', points: 4, pairGroup: '4B', pairRank: 2, type: CARD_TYPE.NORMAL, display: '4', color: 'black' },

  // 幺 - 黑J (♠♣)
  { id: 'j_spade', name: 'J♠', suit: 'spade', value: 'J', points: 1, pairGroup: 'J', pairRank: 1, type: CARD_TYPE.NORMAL, display: 'J', color: 'black' },
  { id: 'j_club', name: 'J♣', suit: 'club', value: 'J', points: 1, pairGroup: 'J', pairRank: 1, type: CARD_TYPE.NORMAL, display: 'J', color: 'black' },

  // 梅(红) - 红10 (♥♦)
  { id: '10_heart', name: '10♥', suit: 'heart', value: '10', points: 0, pairGroup: '10R', pairRank: 0, type: CARD_TYPE.NORMAL, display: '10', color: 'red' },
  { id: '10_diamond', name: '10♦', suit: 'diamond', value: '10', points: 0, pairGroup: '10R', pairRank: 0, type: CARD_TYPE.NORMAL, display: '10', color: 'red' },

  // 九 - 黑9 (♠♣)
  { id: '9_spade', name: '9♠', suit: 'spade', value: '9', points: 9, pairGroup: '9', pairRank: 0, type: CARD_TYPE.NORMAL, display: '9', color: 'black' },
  { id: '9_club', name: '9♣', suit: 'club', value: '9', points: 9, pairGroup: '9', pairRank: 0, type: CARD_TYPE.NORMAL, display: '9', color: 'black' },

  // 黑8 (♠♣)
  { id: '8_spade', name: '8♠', suit: 'spade', value: '8', points: 8, pairGroup: '8B', pairRank: 0, type: CARD_TYPE.NORMAL, display: '8', color: 'black' },
  { id: '8_club', name: '8♣', suit: 'club', value: '8', points: 8, pairGroup: '8B', pairRank: 0, type: CARD_TYPE.NORMAL, display: '8', color: 'black' },

  // 短 - 黑7 (♠♣)
  { id: '7_spade', name: '7♠', suit: 'spade', value: '7', points: 7, pairGroup: '7', pairRank: 0, type: CARD_TYPE.NORMAL, display: '7', color: 'black' },
  { id: '7_club', name: '7♣', suit: 'club', value: '7', points: 7, pairGroup: '7', pairRank: 0, type: CARD_TYPE.NORMAL, display: '7', color: 'black' },

  // 红7 (♥♦)
  { id: '7_heart', name: '7♥', suit: 'heart', value: '7', points: 7, pairGroup: '7R', pairRank: 0, type: CARD_TYPE.NORMAL, display: '7', color: 'red' },
  { id: '7_diamond', name: '7♦', suit: 'diamond', value: '7', points: 7, pairGroup: '7R', pairRank: 0, type: CARD_TYPE.NORMAL, display: '7', color: 'red' },

  // 红6 (♥♦)
  { id: '6_heart', name: '6♥', suit: 'heart', value: '6', points: 6, pairGroup: '6R', pairRank: 0, type: CARD_TYPE.NORMAL, display: '6', color: 'red' },
  { id: '6_diamond', name: '6♦', suit: 'diamond', value: '6', points: 6, pairGroup: '6R', pairRank: 0, type: CARD_TYPE.NORMAL, display: '6', color: 'red' },

  // 五 - 黑5 (♠♣)
  { id: '5_spade', name: '5♠', suit: 'spade', value: '5', points: 5, pairGroup: '5', pairRank: 0, type: CARD_TYPE.NORMAL, display: '5', color: 'black' },
  { id: '5_club', name: '5♣', suit: 'club', value: '5', points: 5, pairGroup: '5', pairRank: 0, type: CARD_TYPE.NORMAL, display: '5', color: 'black' },
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
